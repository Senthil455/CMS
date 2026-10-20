# Repository Structure

This page maps every workspace in the monorepo to its role, stack, entry point, and output. All paths are relative to the repository root.

---

## Top-level layout

```text
CMS/
├── packages/
│   ├── service/      Fastify BFF, AI agents, orchestrator, browser SDK
│   ├── app/          CMS Studio (React 19 + Vite)
│   ├── admin/        CMS Admin (React + PrimeReact)
│   ├── portal/       CMS Portal (React + PrimeReact)
│   ├── stash/        Stash PWA (React + Vite PWA)
│   ├── sdk/          @cms/sdk React hooks/services/routers
│   ├── shared/       DTOs, endpoints, socket events, LayoutCompiler
│   ├── zen/          Standalone health-tracking demo
│   └── hello/        Minimal SPA used to test SPA uploads
├── mono-deploy-local/ Dockerfile, Nginx, Compose, local build scripts
├── mono-deploy-hub/   Multi-arch publishing and production Compose
├── docs/              Wiki, deployment, migration, marketing, video tooling
├── artifacts/         Static landing page and demo images
├── sync-readme.sh     Copies `readme.md` to `../cms/readme.md` when present
├── .agent/            Agent skill definitions
└── .antigravity/      Agent-facing architecture and contract notes
```

The root `package.json` declares `packages/*` as npm workspaces and defines the shared dev/build scripts.

---

## `packages/service` — Fastify AI service

The only backend runtime in this repository. It is both a BFF for the CMS and the AI orchestration server.

| Area | Location | Contents |
|---|---|---|
| Entry point | `src/index.ts` | Fastify setup, CORS, sessions, Socket.IO, static mounts, proxies, SPA fallbacks, error handling |
| Configuration | `src/config.ts` | Zod-validated environment, model lists |
| Routers | `src/routers/` | Chat, AI providers, AI logs, data generation, tasks, config, design styles, Socket.IO |
| Plugins (DI) | `src/plugins/` | Database, repositories, infrastructure, operators, agents, services, auth guard, socket auth |
| Agents | `src/agent/` | `chat-assistant.ts` base class, specialist agents, prompts, page component registry |
| Page components | `src/agent/page-components/` | One directory per component with `prompt.md` and optional `snippet.html` |
| Services | `src/services/` | Orchestrator, status tracking, chat/task helpers |
| Operators | `src/operators/` | Task queue operations |
| Repositories | `src/repositories/` | Prisma-backed data access |
| Infrastructure | `src/infrastructures/` | CMS HTTP client, AI providers, errors |
| Models | `src/models/` | Domain types |
| Prisma | `prisma/schema.prisma` | SQLite models and client generation |
| Browser SDK | `public/static/index.js` | `/static/index.js`, injected into generated pages |
| Resources | `resources/` | Example image assets and schema resources |
| Build output | `dist/` | `tsc` output (Docker runs source through `tsx`) |

**Port:** `3001` (configurable via `PORT`).

**Key scripts:** `dev` (`tsx watch`), `debug` (`tsx watch --inspect`), `build` (`tsc`), `db:init` (`prisma generate` + `db push`), `test` (`vitest run`, currently no test files).

**Database:** `DATABASE_URL`, default `file:./dev.db`. Sessions are stored separately in `sessions.db` in the process working directory.

---

## `packages/shared` — contracts and utilities

Built with `tsc` to `dist/` and consumed by the service, Studio, Stash, and SDK.

| File | Purpose |
|---|---|
| `src/endpoints.ts` | `ENDPOINTS` constants for `/cmsapi`, `/api`, and `/graphql` |
| `src/events.ts` | `SOCKET_EVENTS` and typed client/server event interfaces |
| `src/constants.ts` | `AGENT_NAMES` |
| `src/contracts.ts` | Chat and shared DTOs |
| `src/app.dto.ts` | App/page/schema DTOs |
| `src/utils/layout-compiler.ts` | Assembles generated page HTML |
| `src/utils/` | Other shared helpers |

Build it first (`npm run build:shared`) after changing it; the service imports the compiled output.

---

## `packages/app` — CMS Studio

The primary product surface at `/app/`.

| Aspect | Detail |
|---|---|
| Stack | React 19, Vite 7, TypeScript, Tailwind CSS 4, Monaco, React Flow, GraphiQL, SWR, Socket.IO client |
| Entry | `src/main.tsx` → `src/App.tsx` |
| Routes | `/login`, `/register`, `/` (studio), `/settings` |
| Studio | Three-pane layout: explorer, chat panel, detail panel |
| Detail panel | Entity, query, and page editors; schema graph; API tester; history; publish/preview |
| Chat panel | Message list, entity confirmation cards, task list, AI logs |
| Settings | AI providers, database, admin, CORS, Google Analytics, plugins, design styles, add-SPA |
| Dev port | `5173` |
| Base path | `/app/` |
| Build | `npm run build:app` → `packages/app/dist` |

**Dev proxies:** `/api`, `/graphql`, `/files` → `127.0.0.1:5000`; `/cmsapi` (WebSocket enabled) → `127.0.0.1:3001`; `/admin`, `/portal` → `127.0.0.1:3001`.

---

## `packages/admin` — CMS Admin

Content administration at `/admin/`.

| Aspect | Detail |
|---|---|
| Stack | React, Vite 5, PrimeReact, Chart.js, SWR, CodeMirror |
| Pages | Login/register, users, roles, audit logs, data lists/items, assets, tasks, chunk upload |
| Data access | `@cms/sdk` plus direct `/api` calls |
| Dev port | Vite default `5173` (no custom port or proxy) |
| Base path | `/admin/` |
| Build | `npm run build --workspace=@cms/admin` → `packages/admin/dist` |

Because there is no dev proxy, develop Admin through the service (`http://127.0.0.1:3001/admin/` after a build) or configure the API origin explicitly.

---

## `packages/portal` — CMS Portal

End-user account area at `/portal/`.

| Aspect | Detail |
|---|---|
| Stack | React, Vite 6, PrimeReact, Stripe.js, SWR |
| Pages | Dashboard/activity, assets, bookmarks, notifications, profile, password, avatar, subscriptions |
| Data access | CMS `/api` endpoints and `@cms/sdk` |
| Dev port | Vite default `5173` (no custom port or proxy) |
| Base path | `/portal/` |
| Build | `npm run build --workspace=@cms/portal` → `packages/portal/dist` |

---

## `packages/stash` — offline PWA

Installable companion app at `/stash/`.

| Aspect | Detail |
|---|---|
| Stack | React 19, Vite 5, TypeScript, Tailwind CSS 4, Framer Motion, `idb`, Web Speech API |
| Routes | Explore, bookmarks, assets, offline player, login, register |
| Storage | IndexedDB database `cms-stash` version 4 |
| PWA | `vite-plugin-pwa` with auto-update, standalone display, `/stash/` scope |
| Dev port | `5176` |
| Base path | `/stash/` |
| Build | `npm run build:stash` → `packages/stash/dist` |

See [Stash](./Stash.md) for the storage schema and TTS details.

---

## `packages/sdk` — `@cms/sdk`

React integration layer consumed directly as TypeScript source.

| Directory | Purpose |
|---|---|
| `auth/` | Login, registration, session/profile hooks |
| `cms/` | Entity and query clients |
| `components/` | Shared React components |
| `containers/` | Higher-level containers |
| `engagements/` | Engagement services |
| `notifications/` | Notification services |
| `sub/` | Subscription/Stripe helpers |
| `auditLog/`, `dashboard/` | Admin-facing helpers |
| `hooks/`, `types/`, `utils/` | Shared hooks and types |

`package.json` points `main` and `types` at `index.ts`; it has **no build script**. Do not run `npm run build:sdk`.

---

## `packages/zen` — standalone demo

A health-tracking demo (React 19, Vite 7, Framer Motion, React Router 7) that consumes CMS cookie auth, the `goal` entity, and the `habitTemplateById` query. Its Vite proxy targets `http://localhost:8000`, matching `mono-deploy-local/reload_zen.sh`, which runs a separate Compose project named `zen`.

It is **not mounted by the service** and is not part of the product runtime. It is useful as a CMS-backed React example and as a fixture for the SPA upload flow. The hard-coded guest login (`__guest_` / `aaa`) is demo-only.

---

## `packages/hello` — SPA upload fixture

A minimal two-file React app used to verify the **Settings → Frontend Apps / Add SPA** upload flow. It is not mounted by the service.

---

## `mono-deploy-local` — single-image build

| File | Purpose |
|---|---|
| `Dockerfile` | Two stages: Node build/copy, then .NET 10 runtime with Node, Nginx, ffmpeg |
| `entrypoint.sh` | Writes CMS config, renders Nginx max body size, starts Nginx, Prisma push, `tsx` service, .NET loop |
| `nginx.conf` | Port 5000 gateway and route table |
| `docker-compose.yml` | App + PostgreSQL, `/data` volume, port variables |
| `build-fast.sh` | Builds locally, publishes `CMS.MonoApp`, then `docker build` |
| `reload.sh` | Stops/removes/recreates the `app` service |
| `404.html` | Static 404 page |

The Dockerfile expects the build context to contain a sibling `CMS/` checkout (`COPY CMS/...`) and a published `CMS/publish` directory. See [Docker Deployment](./Docker-Deployment.md).

---

## `mono-deploy-hub` — publishing

| File | Purpose |
|---|---|
| `build-multiarch.sh` | Builds and pushes `senthil455/cms-mono` for `linux/amd64,linux/arm64` |
| `docker-compose.prod.yml` | Pull-based production Compose with PostgreSQL |
| `DOCKERHUB.md` | Docker Hub listing and quick start |
| `Zero-Cost-Guide.md` | Free-tier hosting notes |

---

## `docs`

| Path | Contents |
|---|---|
| `docs/wiki/` | This wiki |
| `docs/migration-guide.md` | Host-to-host migration |
| `docs/marketing-strategy.md` | Positioning and adoption plan |
| `docs/antigravity-integration.md` | AI coding agent integration paths |
| `docs/videos/` | Voiceover/subtitle workflow and `generate_voice.py` |

---

## Port summary

| Service | Port | Notes |
|---|---|---|
| Nginx gateway | `5000` | Production entry point |
| Fastify | `3001` | `/cmsapi`, SPAs, `/static` |
| ASP.NET Core CMS | `5001` | Internal in Docker; also the default public CMS target locally |
| CMS local public | `5000` | `CMS_BASE_URL` default |
| Studio dev | `5173` | `/app/` |
| Admin/Portal dev | `5173` | Must run one at a time |
| Stash dev | `5176` | `/stash/` |
