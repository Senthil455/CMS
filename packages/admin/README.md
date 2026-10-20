# CMS Admin (`@cms/admin`)

Content-administration interface for the CMS.

- **Production path:** `/admin/`
- **Stack:** React 19, Vite 5, PrimeReact, Chart.js, SWR, CodeMirror, `@cms/sdk`
- **Build output:** `packages/admin/dist`

---

## What it does

| Area | Capabilities |
|---|---|
| Data | Browse, create, edit, and delete entity records |
| Assets | Upload, inspect, and delete files; convert media |
| Users | Manage users, roles, and permissions |
| Audit | Browse audit logs and entry details |
| Tasks | Inspect background/system tasks |
| Chunks | Upload large files in chunks |
| Account | Login, registration, profile, password |

The Admin uses `@cms/sdk` for routers, hooks, and services, and calls CMS `/api` routes directly for some operations.

---

## Setup

From the repository root:

```bash
npm install
npm run build:shared
npm run dev:admin
```

Vite starts on its default port `5173` with `--host 127.0.0.1`. Open `http://127.0.0.1:5173/admin/`.

> The Admin has **no dev proxy**. `/api` calls are same-origin by default, so during local development either:
>
> - build the Admin and load it through the Fastify service at `http://127.0.0.1:3001/admin/`, or
> - set `VITE_REACT_APP_API_URL` to the CMS origin (for example `http://127.0.0.1:5000`) and configure CMS CORS.
>
> The Studio also uses port `5173`, so do not run `dev:app` and `dev:admin` at the same time without changing one port.

---

## Configuration

`src/config.ts` reads build-time Vite variables:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_REACT_APP_API_URL` | `''` (same origin) | CMS API origin |
| `VITE_REACT_APP_ROUTER_PREFIX` | `/admin` | Route prefix for entity, auth, audit, and profile routers |

Example `.env.local`:

```bash
VITE_REACT_APP_API_URL=http://127.0.0.1:5000
VITE_REACT_APP_ROUTER_PREFIX=/admin
```

If the API is on another origin, add the Admin origin in **Studio → Settings → CORS**. Cookies require `credentials: 'include'`, which `@cms/sdk` already sets.

---

## Build

```bash
npm run build --workspace=@cms/admin
```

Output: `packages/admin/dist`.

The Fastify service serves it at `/admin/`. `vite.config.ts` sets `base: '/admin/'`; changing that base breaks asset loading in production.

---

## Notes and limitations

- No dev proxy is defined. Local development requires the service or an explicit API origin.
- The Admin depends on CMS permissions. The service does not enforce them for Studio routes.
- There is no automated test suite for this workspace.

---

## Related

- [Architecture](../../docs/wiki/Architecture.md)
- [API Reference](../../docs/wiki/API-Reference.md)
- [Repository Structure](../../docs/wiki/Repository-Structure.md)
- [Setup](../../docs/wiki/Setup.md)
