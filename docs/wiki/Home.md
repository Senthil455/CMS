# CMS Wiki

CMS is an AI-assisted headless CMS and app builder. This wiki documents what is actually in the repository: a **Node.js + Fastify AI studio/BFF** that works with a **separate ASP.NET Core CMS runtime**.

> **Start here:** [Setup](./Setup.md) → [Architecture](./Architecture.md) → [Building a System](./Building-a-System.md).

## 🎯 New here?

1. **[Setup](./Setup.md)** — run the Docker image, or run the Node service against an existing CMS backend.
2. **[Architecture](./Architecture.md)** — understand the two runtimes, ports, and data ownership.
3. **[Repository Structure](./Repository-Structure.md)** — find your way around every workspace.
4. **[Building a System](./Building-a-System.md)** — the entity → data → query → page workflow.

## 📚 All pages

| Page | Description |
|---|---|
| [Setup](./Setup.md) | Local development, Docker-backed CMS, environment variables, troubleshooting |
| [Architecture](./Architecture.md) | Runtime topology, request flows, data ownership, security boundaries |
| [Repository Structure](./Repository-Structure.md) | Every package, its stack, entry points, and how it is served |
| [Building a System](./Building-a-System.md) | The core workflow: entities, relationships, seed data, queries, pages |
| [Orchestrator Strategy](./Orchestrator-Strategy.md) | Agents, intent routing, task queue, confirmations, replay, cancellation |
| [Page Templates & Interactivity](./Page-Templates-Interactivity.md) | LayoutCompiler, generated HTML, Alpine.js, browser SDK |
| [Engagement Features](./Engagement-Features.md) | Views, likes, shares, bookmarks, toplist, and where they live |
| [API Reference](./API-Reference.md) | Local `/cmsapi` routes, Socket.IO events, proxied `/api` and `/graphql` |
| [Docker Deployment](./Docker-Deployment.md) | Image contents, Nginx routing, volumes, build scripts, troubleshooting |
| [Performance & Scalability](./Performance-Scalability.md) | Measured characteristics, bottlenecks, and scaling guidance |
| [Contributing](./Contributing.md) | Adding agents, page components, prompts, routes, and UI features |
| [Stash](./Stash.md) | The offline-first PWA: IndexedDB stores, TTS, media, sync |
| [Vite + React + AI](./Vite-React-Antigravity-Example.md) | Build an external frontend against the CMS APIs |
| [Migration Guide](../migration-guide.md) | Move a Docker deployment and its data to another host |
| [Antigravity Integration](../antigravity-integration.md) | What AI coding agents can do with this repository today |

## 👤 Who should read what?

| Page | Best for |
|---|---|
| Setup | New contributors, DevOps |
| Architecture | Architects, backend developers |
| Repository Structure | Anyone opening the repo for the first time |
| Building a System | Product builders, full-stack developers |
| Orchestrator Strategy | Backend and AI engineers |
| Page Templates & Interactivity | Frontend developers |
| Engagement Features | Full-stack developers, product managers |
| API Reference | Integrators, frontend developers, automation authors |
| Docker Deployment | DevOps, self-hosters |
| Performance & Scalability | DevOps, performance engineers |
| Contributing | Contributors and maintainers |
| Stash | Mobile/PWA developers |
| Vite + React + AI | Developers building an external frontend |

## 🔗 Quick links

- [Main README](../../README.md) — quick start and feature overview
- [GitHub repository](https://github.com/Senthil455/CMS)
- [Docker Hub image](https://hub.docker.com/r/senthil455/cms-mono)

## ⚠️ Read this first

- The **.NET CMS source is not in this repository**. The Docker image expects a sibling `CMS` checkout with a published `CMS.MonoApp`; the Node workspace itself only needs a reachable CMS at `CMS_BASE_URL`.
- The Fastify service **authenticates** requests by validating the upstream CMS session cookie. It does **not** enforce CMS roles on `/cmsapi` routes.
- There is **no automated test suite** in this checkout. `vitest` is installed in `@cms/service` but no test files exist.
- AI provider keys are stored in the service's SQLite database as **plaintext**.
