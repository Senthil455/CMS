# API Reference

CMS exposes two API surfaces through one origin:

1. **Local service API** under `/cmsapi` — implemented by the Fastify service in this repository.
2. **CMS API** under `/api`, `/graphql`, and `/files` — implemented by the ASP.NET Core runtime and proxied by Fastify, or routed directly by Nginx in production.

There is no OpenAPI document in the repository. This page reflects the routes and contracts defined in code.

---

## 1. Conventions

### Authentication

All `/cmsapi` routes are guarded by `fastify.authenticate`. The service reads the CMS session cookie, calls the CMS profile endpoint, and populates `request.user`.

- Missing/invalid session → `401 { "success": false, "error": "Unauthorized" }`
- The service does **not** check CMS roles or permissions.
- The same cookie is forwarded to the CMS for every upstream call.

`/api`, `/graphql`, and `/files` are not authenticated by Fastify. The CMS enforces its own rules.

### Response envelope

Most local routes return:

```json
{ "success": true, "data": { } }
```

Errors use:

```json
{ "success": false, "error": "Human-readable message" }
```

Validation failures return HTTP 400 with `{ "error": "Validation failed", "details": [...] }`. Unhandled errors return HTTP 500 with a generic message. Prisma `P2002` maps to 409 and `P2025` maps to 404.

### Base URLs

| Environment | Base |
|---|---|
| Local service | `http://127.0.0.1:3001` |
| Docker / production | `http://localhost:5000` (Nginx) |
| Local CMS | `http://127.0.0.1:5000` (`CMS_BASE_URL`) |
| Internal CMS in Docker | `http://127.0.0.1:5001` |

---

## 2. Local service routes (`/cmsapi`)

### Chat

| Method | Path | Description |
|---|---|---|
| `GET` | `/cmsapi/chat/history` | Paginated chat history for the current user. Query: `limit` (default 10), `beforeId`. Returns `ChatMessage[]` ascending. |
| `POST` | `/cmsapi/chat/cancel` | Aborts the active orchestration request for the current user. Returns `{ success, cancelled }`. |
| `GET` | `/cmsapi/page-addons` | Returns `PAGE_COMPONENT_REGISTRY`: the page components that can be added to a page. |

Chat messages themselves are sent over Socket.IO, not REST.

### AI providers and logs

| Method | Path | Description |
|---|---|---|
| `GET` | `/cmsapi/ai/providers` | Model combinations for providers with a stored key, e.g. `["gemini/gemini-3-pro", "openai/gpt-5.2"]`. |
| `GET` | `/cmsapi/ai/logs` | All `AiResponseLog` rows, newest first. Used by the AI Logs panel and `@replay`. |
| `DELETE` | `/cmsapi/ai/logs/:id` | Deletes one log entry. |
| `POST` | `/cmsapi/ai/generate-data` | Generates a single entity record. Body: `entityName` (required), `requirement`, `existingData`, `modelSelection`. |

`generate-data` loads the current entity schema from the CMS, uses `agent/single-item-generator.md`, and returns parsed JSON.

### Tasks

| Method | Path | Description |
|---|---|---|
| `GET` | `/cmsapi/tasks` | Latest `AgentTask` rows. Query: `limit` (default 20). |
| `PATCH` | `/cmsapi/tasks/:taskId/items/:index/toggle` | Marks one task item complete/incomplete. |

Tasks are a **global queue**: they are not scoped by user. Any authenticated caller can read or toggle them.

### Provider configuration

| Method | Path | Description |
|---|---|---|
| `GET` | `/cmsapi/config/gemini` | `{ configured, maskedKey, available }` |
| `PUT` | `/cmsapi/config/gemini` | Body `{ apiKey }`. Persists and updates live provider instances. |
| `DELETE` | `/cmsapi/config/gemini` | Removes the key and clears live instances. |
| `GET` | `/cmsapi/config/openai` | `{ configured, maskedKey, available }` |
| `PUT` | `/cmsapi/config/openai` | Body `{ apiKey }`. |
| `DELETE` | `/cmsapi/config/openai` | Removes the key. |
| `GET` | `/cmsapi/config/analytics` | `{ enabled, measurementId }` for Google Analytics. |
| `PUT` | `/cmsapi/config/analytics` | Body `{ enabled: boolean, measurementId: string }`. |

Keys are stored in plaintext. Masked values are returned for display only.

### Design styles

| Method | Path | Description |
|---|---|---|
| `GET` | `/cmsapi/design-styles` | All styles. |
| `POST` | `/cmsapi/design-styles` | Create. Body: `name`, `displayName`, `description?`, `listPrompt?`, `detailPrompt?`. |
| `PUT` | `/cmsapi/design-styles/:id` | Update any of the fields above. |
| `DELETE` | `/cmsapi/design-styles/:id` | Delete. |

A design style supplies prompt fragments that page agents use for list and detail pages.

### Socket.IO

- **Path:** `/cmsapi/socket.io`
- **Transport:** Socket.IO 4, WebSocket with polling fallback
- **Auth:** cookie validated by `socket-auth`; `socket.data.user` and `socket.data.externalCookie` are set before connection handling

#### Client → server

| Event | Payload | Purpose |
|---|---|---|
| `chat:send_message` | `{ content: string, providerName?: string }` | Send a prompt or special command. Defaults to `gemini/gemini-3-flash`. |
| `chat:agent_feedback_response` | `{ agentName, feedbackData, selection? }` | Confirm a plan, choose a template, or supply requested input. |

#### Server → client

| Event | Payload | Purpose |
|---|---|---|
| `chat:message_received` | `ChatMessage` | A user or agent message to append. |
| `chat:schemas_sync` | `{ task_type, schemasId: string[] }` | Refresh these schemas in the Studio. |
| `chat:agent_plan_to_confirm` | `{ agentName, data, agentTaskItem? }` | Agent needs confirmation before writing. |
| `chat:agent_status` | `{ agentName: string \| null, createdAt? }` | Current agent activity; `null` clears it. Re-sent on connect. |

Agent names are listed in `packages/shared/src/constants.ts`; see [Orchestrator Strategy](./Orchestrator-Strategy.md#agent-catalogue).

---

## 3. Special chat commands

| Command | Format | Effect |
|---|---|---|
| Replay | `@replay <logId>` | Re-executes the stored plan from `AiResponseLog` with the same handler and model selection. Does not re-run the LLM. |
| Execute task | `@execute-task <taskId>` | Starts the next pending item in a persisted task. |
| Modify component | `@modify-component <schemaId> <componentId> [requirement]` | Routes to the page-component agent that owns the component. |
| Direct agent | `@<agent_name>[#<schemaId>] <prompt>` | Skips intent classification. Example: `@page_architect#FHzhVfdnWQ0j add a FAQ section`. |

---

## 4. Proxied CMS API

Fastify registers transparent proxies:

| Prefix | Upstream | Rewrite |
|---|---|---|
| `/api/` | `CMS_BASE_URL` | `/api/` |
| `/graphql` | `CMS_BASE_URL` | `/graphql` |

In Docker, Nginx sends `/files/` directly to the CMS and also sends `/` (CMS pages and setup UI) there.

The constants below come from `packages/shared/src/endpoints.ts`. Paths use the CMS's conventions; check the CMS implementation for exact methods, request bodies, and response shapes.

### Auth and profile

| Path | Purpose |
|---|---|
| `/api/login` | Log in |
| `/api/register` | Register |
| `/api/logout` | Log out |
| `/api/me` | Current user profile |
| `/api/profile/password` | Change password |
| `/api/profile/avatar` | Update avatar |
| `/api/system/is-ready` | Setup/system readiness |
| `/api/system/download-plugins` | Download plugins |

### Schemas

| Path | Purpose |
|---|---|
| `/api/schemas?type=` | List schemas by type |
| `/api/schemas` | Create/save schema |
| `/api/schemas/entity/define` | Define an entity |
| `/api/schemas/publish` | Publish schemas |
| `/api/schemas/:id` | Get/update/delete by schema ID |
| `/api/schemas/schema/:id` | Get by schema ID variant |
| `/api/schemas/name/:name` | Get by name |
| `/api/schemas/entity/:entityName` | Get an entity definition |
| `/api/schemas/history/:schemaId` | Schema version history |

### Queries and page data

| Path | Purpose |
|---|---|
| `/api/queries/:id` | Execute a saved query |
| `/api/page-data` | Load data for a generated page |

### Entities and records

| Path | Purpose |
|---|---|
| `/api/entities/:schemaName` | List records |
| `/api/entities/tree/:schemaName` | Nested record tree |
| `/api/entities/:schemaName/:id` | Get one record |
| `/api/entities/:schemaName/insert` | Insert |
| `/api/entities/:schemaName/update` | Update |
| `/api/entities/:schemaName/delete` | Delete |
| `/api/entities/:schemaName/publication` | Publish/unpublish |
| `/api/entities/lookup/:schemaName` | Lookup options |
| `/api/entities/junction/...` | Junction IDs, data, save, delete |
| `/api/entities/collection/:schemaName/:id/:field` | Collection items and insert |

### Assets

| Path | Purpose |
|---|---|
| `/api/assets` | List/upload assets |
| `/api/assets/:id` | Get/delete asset |
| `/api/assets/path`, `/api/assets/entity` | Lookup by path or entity |
| `/api/assets/base`, `/api/assets/meta/:id` | Info and metadata |
| `/api/assets/video`, `/api/assets/progress` | Video serving and progress |
| `/api/assets/convert-mp3/:id`, `convert-m4a/:id`, `convert-m4b/:id` | Audio conversion |

### Engagement, bookmarks, notifications

| Path | Purpose |
|---|---|
| `/api/engagements/list/:type` | List engagement records |
| `/api/engagements/counts` | Counts for records |
| `/api/engagements/page-counts` | Counts for pages |
| `/api/engagements/visit-counts` | Visit counts |
| `/api/engagements/delete/:id` | Remove an engagement |
| `/api/bookmarks/folders` | List/create folders |
| `/api/bookmarks/list/:folderId` | Bookmarks in a folder |
| `/api/bookmarks/folders/update/:id`, `delete/:id` | Folder management |
| `/api/bookmarks/delete/:id` | Delete bookmark |
| `/api/notifications` | Notifications |

### Tasks, chunks, subscriptions

| Path | Purpose |
|---|---|
| `/api/tasks`, `/api/tasks/entity` | Background tasks |
| `/api/tasks/export`, `/api/tasks/import` | Export/import |
| `/api/tasks/import/demo`, `/api/tasks/emit` | Demo import and event emit |
| `/api/tasks/export/archive/:id`, `/api/tasks/export/download/:id` | Archives |
| `/api/chunks/`, `/api/chunks/status`, `/api/chunks/commit` | Chunked uploads |
| `/api/subscriptions/sub_prices`, `sub_sessions`, `sub_info` | Stripe subscription data |

### GraphQL

| Path | Purpose |
|---|---|
| `/graphql` | Queries, mutations, and introspection |

---

## 5. Static and SPA routes

| Path | Served by | Behavior |
|---|---|---|
| `/app/*` | Fastify | Studio assets; unknown subpaths return `app/dist/index.html` |
| `/admin/*` | Fastify | Admin assets; fallback to `admin/dist/index.html` |
| `/portal/*` | Fastify | Portal assets; fallback to `portal/dist/index.html` |
| `/stash/*` | Fastify | PWA assets and service worker; fallback to `stash/dist/index.html` |
| `/static/*` | Fastify | Browser SDK (`index.js`) |
| `/files/*` | CMS (Nginx direct in Docker) | Uploaded assets |
| `/` | CMS | CMS UI and generated pages |

---

## 6. Error behavior

| Condition | Status | Body |
|---|---|---|
| No session | 400?/401 | `{ success: false, error: "Unauthorized" }` (401) |
| Zod validation | 400 | `{ error: "Validation failed", details }` |
| `UserVisibleError`, `CmsError`, `AgentProviderError` | 400 | `{ success: false, error: message }` |
| Prisma unique conflict (`P2002`) | 409 | `{ success: false, error: "Resource conflict or already exists" }` |
| Prisma not found (`P2025`) | 404 | `{ success: false, error: "Resource not found" }` |
| Unexpected | 500 | Generic internal error message |

Socket handlers do not send HTTP errors. Failures are converted to agent chat messages by the orchestrator where possible, and logged otherwise.

---

## 7. Related pages

- [Orchestrator Strategy](./Orchestrator-Strategy.md) — how commands and agents execute
- [Page Templates & Interactivity](./Page-Templates-Interactivity.md) — browser SDK used by generated pages
- [Engagement Features](./Engagement-Features.md) — engagement endpoint usage
