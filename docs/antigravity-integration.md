# AI Coding Agents and CMS

This page describes how an AI coding agent such as Antigravity can work with CMS **today**, what the repository actually exposes, and which integrations are still proposals.

> **Short version:** CMS already contains an in-product AI builder (the Studio at `/app/`). An external coding agent can build a frontend against the CMS REST/GraphQL APIs and can read the schemas those APIs expose. There is **no** public "generate a schema from a prompt" REST endpoint, **no** published npm SDK, and **no** MCP server in this repository.

---

## 1. What ships today

### 1.1 In-product AI builder (Studio)

The AI workflow is implemented inside this repository as the Fastify service plus the Studio UI:

| Capability | Where it lives | Status |
|---|---|---|
| Chat with specialist agents | `packages/service/src/agent/` + Socket.IO | ✅ Shipped |
| Entity design and relationship changes | `entity_designer` agent, CMS `/api/schemas*` | ✅ Shipped |
| Sample-data generation | `data_synthesizer` agent, `/cmsapi/ai/generate-data` | ✅ Shipped |
| GraphQL query generation and REST endpoint creation | `query_builder` agent | ✅ Shipped |
| Page planning, layout, and component HTML | `page_planner`, `page_architect`, page-component agents | ✅ Shipped |
| Multi-step app planning | `system_architect` agent, global task queue | ✅ Shipped |
| Replay and manual task execution | `@replay`, `@execute-task` chat commands | ✅ Shipped |

The browser talks to the service over REST and Socket.IO under `/cmsapi`. The service validates the upstream CMS session cookie and calls the CMS `/api` routes on the user's behalf. See [API Reference](./wiki/API-Reference.md) for the full route and event inventory.

The agents do **not** expose a stable, documented generation API. They are driven by the Studio chat protocol:

```text
POST /cmsapi/chat/...          (history, status, cancel)
Socket.IO /cmsapi/socket.io    (chat:send_message, chat:message_received, ...)
```

An external agent can technically speak this protocol if it has a valid CMS session cookie, but it is an internal studio contract, not a public API. Prefer the route below.

### 1.2 External frontend workflow (recommended)

This is the supported integration path and does not require any CMS code changes:

1. Run CMS (Docker image or your own deployment) on port `5000`.
2. Create entities, records, and queries in the Studio.
3. Start an external frontend (Vite, Next.js, etc.) and proxy `/api`, `/graphql`, and `/files` to CMS.
4. Give your coding agent the concrete API contract:
   - entity name and field list,
   - endpoint (`/api/entities/<name>`, `/api/queries/<id>`),
   - GraphQL schema (introspection),
   - authentication requirements (`credentials: 'include'`).

```text
GET  /api/entities/:schemaName
POST /api/entities/:schemaName/insert
POST /api/entities/:schemaName/update
POST /api/entities/:schemaName/delete
GET  /api/queries/:id
POST /graphql
```

The full walkthrough, including login and Vite proxy configuration, is in [Building an External Frontend](./wiki/Vite-React-Antigravity-Example.md).

### 1.3 Schema discovery for agents

The CMS exposes enough information for an agent to discover the data model without reading backend source:

| Source | What it returns |
|---|---|
| `GET /api/schemas?type=` | Schema list |
| `GET /api/schemas/entity/:entityName` | Entity schema by name |
| `GET /api/schemas/:id` | Schema by ID |
| `POST /graphql` (introspection) | Full GraphQL type system |
| Studio API tester / GraphiQL | Interactive inspection |

A useful agent prompt looks like this:

> *"Read the CMS schema for the `book` entity via `/api/schemas/entity/book`. Then build a `BookList` page using `/api/entities/book`. Fields are `id`, `title`, `price`, `coverImage.url`. Use `credentials: 'include'` and handle loading, empty, and error states."*

The exact response envelope is owned by the CMS, which is not in this repository. Inspect a real response before hard-coding types.

### 1.4 Repository-local agent configuration

The repository contains agent-facing notes and a skill:

| Path | Purpose | Accuracy |
|---|---|---|
| `.agent/skills/cms-react-app/SKILL.md` | Patterns for external React apps: auth, entity APIs, named queries | ✅ Matches the API constants |
| `.antigravity/monorepo.structure.yaml` | Workspace map for agents | ✅ Updated to the real packages |
| `.antigravity/shared.contracts.md` | Endpoint and socket-event ownership | ✅ Updated to `packages/shared/src` |
| `.antigravity/backend.fastify.md` | Fastify layering rules | ✅ Updated to `packages/service` |

These files are guidance, not executable tooling. They do not give an external agent access to the CMS by themselves.

### 1.5 `@cms/sdk`

`packages/sdk` is an internal React integration layer:

- consumed directly as TypeScript source by Admin, Portal, and Stash;
- `package.json` points `main` and `types` at `index.ts`;
- it has **no build script** and is **not published to npm**.

An external project can copy patterns from it, but should not expect `npm install @cms/sdk` to resolve to this workspace.

---

## 2. What does not exist

Be explicit about these gaps when planning agent integration:

| Proposal | Reality |
|---|---|
| `POST /api/ai/schema/generate` | Not implemented. Schema generation runs through the Studio chat pipeline. |
| `POST /api/ai/query/generate` | Not implemented as a standalone route. Query generation runs through the `query_builder` agent. |
| Public SDK package | `@cms/sdk` is a private, source-only workspace. |
| MCP server | No MCP server, manifest, or tool schema exists in this repository. |
| Stable agent-generation REST contract | The Studio's `/cmsapi` routes and socket events are internal and can change. |
| Automatic full-stack deployment | No deploy orchestration. Pages are stored by the CMS; frontend source stays in your repository. |

The upstream CMS owns `/api/schemas*`, `/api/entities*`, `/api/queries*`, and `/graphql`. Those routes are consumed by the Studio, but their implementation and response envelopes cannot be verified from this checkout.

---

## 3. Integrating an external agent, step by step

### Step 1 — Provision the backend

Use the published image or your own CMS deployment:

```bash
docker run -d \
  --name cms \
  -p 5000:5000 \
  -v cms_data:/data \
  -e DATABASE_PROVIDER=0 \
  -e "CONNECTION_STRING=Data Source=/data/cms.db" \
  -e CMS_DATA_PATH=/data \
  -e "DATABASE_URL=file:/data/app/sqlite.db" \
  senthil455/cms-mono:latest
```

Open `http://localhost:5000/app/`, create the Super Admin, add an AI key under **Settings → AI Providers**, and build the data model.

### Step 2 — Create the schema (Studio, not an API call)

Use the Studio chat or the visual editors. For example:

> *"Design a library system with books, authors, and loans. Add sample data for books. Create a query that lists available books."*

The agents write through the CMS API and sync the resulting schemas back to the Studio.

### Step 3 — Export the contract

Record the parts the external agent needs:

```text
Entity: book
Fields: id, title, price, coverImage { url }, authorId
List:   GET /api/entities/book
Query:  GET /api/queries/<queryId>
GraphQL: POST /graphql
Auth:   cookie session; send credentials on every request
```

You can obtain field names from the Studio, from `/api/schemas/entity/book`, or from GraphQL introspection.

### Step 4 — Generate the frontend

Point the coding agent at a local proxy so cookies stay same-origin:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    '/graphql': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    '/files': { target: 'http://127.0.0.1:5000', changeOrigin: true },
  },
}
```

Then give it the contract from Step 3. Keep the agent focused on the frontend; the backend already exists.

### Step 5 — Iterate

```text
Studio: change schema or query
  → re-read the schema contract
  → update frontend types and components
  → rebuild and deploy the frontend
```

Schema and content live in CMS. React source lives in your repository.

---

## 4. Design proposals (not implemented)

The following ideas are reasonable next steps, but none of them are shipped. They are recorded here so they are not mistaken for current behavior.

### Proposal A — Read-only schema export endpoint

Add a small, versioned endpoint that returns a machine-readable bundle:

```json
{
  "entities": [{ "name": "book", "fields": ["id", "title", "price"] }],
  "queries": [{ "id": "available-books", "endpoint": "/api/queries/available-books" }],
  "graphqlEndpoint": "/graphql"
}
```

This would let an external agent bootstrap without scraping the Studio. It would need to live in the CMS (which owns schemas) or be a thin read-only aggregation in the Fastify service.

### Proposal B — Generation endpoint

Wrap the existing orchestrator behind a REST route, for example:

```text
POST /cmsapi/agent/run
{ "agent": "entity_designer", "prompt": "Blog with posts and authors" }
```

Risks: long-running work, partial failures, idempotency, and the existing global task queue. This needs a job model and cancellation semantics before it is safe to expose.

### Proposal C — MCP server

An MCP server could expose tools such as `list_schemas`, `get_entity`, `run_query`, and `create_entity`. Nothing in this repository implements MCP today. The CMS REST/GraphQL APIs are the natural backing layer.

### Proposal D — Publish `@cms/sdk`

Publishing would require a build step, a public package name, semver, and a decision about React peer dependencies. The current workspace intentionally avoids all of that.

---

## 5. Guardrails

- **Authentication:** every CMS call needs a valid session cookie. The service validates it and forwards it upstream; it does not create CMS users.
- **Authorization:** the Fastify service checks authentication only. It does **not** enforce CMS roles on `/cmsapi` routes. Do not expose the Studio to untrusted users.
- **Secrets:** AI provider keys are stored in the service SQLite database as plaintext. Never let an agent read `.env` or the database and echo keys into logs.
- **Destructive actions:** schema deletion, entity deletion, and `prisma db push --accept-data-loss` at container start can destroy data. Require human confirmation.
- **Generated code:** review it. The agents generate plausible code, not guaranteed-correct code.

---

## 6. Related pages

- [Building an External Frontend](./wiki/Vite-React-Antigravity-Example.md) — supported frontend workflow
- [API Reference](./wiki/API-Reference.md) — `/cmsapi`, Socket.IO, and upstream routes
- [Repository Structure](./wiki/Repository-Structure.md) — where agents, prompts, and components live
- [Architecture](./wiki/Architecture.md) — runtime boundary and data ownership
- [Orchestrator Strategy](./wiki/Orchestrator-Strategy.md) — how the in-product agents actually run
