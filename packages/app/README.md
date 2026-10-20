# CMS Studio (`@cms/app`)

The primary product surface: an AI chat studio plus schema, query, and page editors.

- **Production path:** `/app/`
- **Dev URL:** `http://127.0.0.1:5173/app/`
- **Stack:** React 19, Vite 7, TypeScript, Tailwind CSS 4, Monaco, React Flow, GraphiQL, SWR, Socket.IO client

---

## What it does

| Area | Capabilities |
|---|---|
| Chat | Send prompts to specialist agents, confirm plans, view task progress, cancel runs, replay AI logs |
| Explorer | Browse schemas, queries, pages, and design styles |
| Schema editor | Edit fields, relationships, lookups, and junctions; view the schema graph |
| Query editor | Edit GraphQL and save REST endpoints |
| Page editor | Design pages, edit components, preview generated HTML |
| API tester | Call CMS endpoints and inspect responses |
| Settings | AI providers, database, admin, CORS, analytics, plugins, design styles, frontend apps |
| Auth | Login, registration, first-run setup redirect |

The Studio is a static SPA. It talks to the Fastify service and the CMS through same-origin paths; it has no server runtime of its own.

---

## Setup

Run from the repository root:

```bash
npm install
npm run build:shared
npm run dev:app
```

`npm run dev:app` starts Vite on `5173`. Open `http://127.0.0.1:5173/app/`.

The service must be running for `/cmsapi` and Socket.IO, and the CMS must be reachable at `CMS_BASE_URL` for `/api` and `/graphql`:

```bash
npm run dev:service    # Fastify on :3001
```

The easiest way to provide the CMS is the Docker image on port `5000`:

```bash
docker run -d --name cms -p 5000:5000 senthil455/cms-mono:latest
```

Use `127.0.0.1` consistently. Mixing `localhost` and `127.0.0.1` splits cookies and causes login loops.

---

## Dev proxy

`vite.config.ts` defines:

| Path | Target | Notes |
|---|---|---|
| `/api` | `http://127.0.0.1:5000` | CMS REST |
| `/graphql` | `http://127.0.0.1:5000` | CMS GraphQL |
| `/files` | `http://127.0.0.1:5000` | Uploaded assets |
| `/cmsapi` | `http://127.0.0.1:3001` | Fastify API, WebSocket enabled |
| `/admin` | `http://127.0.0.1:3001` | Admin SPA |
| `/portal` | `http://127.0.0.1:3001` | Portal SPA |

The base path is `/app/`. Routes use absolute `/app/...` paths, so opening `http://127.0.0.1:5173/` redirects to `/app`.

---

## Routes

| Route | Purpose |
|---|---|
| `/app/login` | Login |
| `/app/register` | Registration |
| `/app/` | Studio |
| `/app/overview` | Studio overview |
| `/app/:type/:id` | Resource detail |
| `/app/:type/:id/edit` | Resource edit |
| `/app/settings` | System settings and first-run setup |

`ProtectedRoute` redirects to `/app/settings` when no Super Admin exists, and to `/app/login` when the user is unauthenticated. Users without the `menu_schema_builder` menu permission see an access-denied screen.

---

## Build

```bash
npm run build:app
# or
npm run build --workspace=@cms/app
```

Output: `packages/app/dist`.

The Fastify service serves this directory at `/app/`. A production build must use the `/app/` base path, which is set in `vite.config.ts`.

`npm run build:app` runs `tsc -b && vite build`. Type errors fail the build.

---

## Notes and limitations

- The Studio is an internal builder. The service authenticates but does not enforce CMS roles on `/cmsapi`.
- AI provider keys are managed in the UI and stored in the service SQLite database as plaintext.
- Generated page previews depend on Tailwind, Alpine.js, and `marked` CDNs at runtime.
- There is no component test suite in this workspace.

---

## Related

- [Architecture](../../docs/wiki/Architecture.md)
- [Repository Structure](../../docs/wiki/Repository-Structure.md)
- [API Reference](../../docs/wiki/API-Reference.md)
- [Building a System](../../docs/wiki/Building-a-System.md)
