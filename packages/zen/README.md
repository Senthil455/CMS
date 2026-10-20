# Zen (`@cms/zen`)

A standalone health-tracking demo that shows how a small React SPA can consume CMS entities, queries, and cookie auth.

- **Stack:** React 19, Vite 7, TypeScript, Framer Motion, React Router 7, Lucide
- **Not mounted by the Fastify service.** It is a separate frontend example.
- **Not part of the product runtime.** Nothing at `/app`, `/admin`, `/portal`, or `/stash` serves it.

---

## What it demonstrates

| Route | Screen |
|---|---|
| `/` | Daily dashboard |
| `/check-in` | Habit check-in |
| `/goals` | Goals list backed by the `goal` entity |
| `/trends` | Charts and progress |
| `/explore` | Habit templates |

The app uses:

- `GET /api/me` for the session,
- `POST /api/login` (including a guest login fallback),
- `POST /api/register` and `/api/logout`,
- `GET /api/entities/goal` for records,
- `GET /api/queries/habitTemplateById` for template details.

All requests use `credentials: 'include'`.

---

## Setup

From the repository root:

```bash
npm install
npm run dev --workspace=@cms/zen
```

Vite serves the app on its default port `5173`.

`vite.config.ts` proxies:

| Path | Target |
|---|---|
| `/api` | `http://localhost:8000` |
| `/files` | `http://localhost:8000` |

The `8000` target matches `mono-deploy-local/reload_zen.sh`, which runs a second Compose project named `zen` on port `8000` with PostgreSQL on `5433`.

If your CMS is elsewhere, edit the proxy target in `packages/zen/vite.config.ts`. There is no environment-variable override.

### Backend requirements

The demo expects these to exist in the target CMS:

- a `goal` entity with `targetValue`, `habitTemplate`, and publication fields;
- a `habitTemplateById` query;
- guest-login support (`__guest_` / `aaa`) for the automatic fallback.

These are demo data, not part of the core schema. Without them the screens will show errors or empty states.

---

## Build

```bash
npm run build --workspace=@cms/zen
```

Output: `packages/zen/dist`.

There is no service route for this output. Serve it with any static host, or upload it through **Settings → Frontend Apps** in the Studio. The build uses the default `/` base path.

---

## Why it exists

Zen is useful as:

- a reference for a CMS-backed React app with login and entity queries;
- a fixture for the SPA upload flow;
- a second-environment test for the Docker/Compose setup.

It is not a template for production auth. The guest credentials are hard-coded and intended for a demo environment only.

---

## Related

- [Building an External Frontend](../../docs/wiki/Vite-React-Antigravity-Example.md)
- [API Reference](../../docs/wiki/API-Reference.md)
- [Repository Structure](../../docs/wiki/Repository-Structure.md)
