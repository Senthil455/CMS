# CMS Portal (`@cms/portal`)

End-user account area for CMS.

- **Production path:** `/portal/`
- **Stack:** React 19, Vite 6, PrimeReact, Stripe.js, SWR, `@cms/sdk`
- **Build output:** `packages/portal/dist`

---

## What it does

| Area | Capabilities |
|---|---|
| Activity | Reading history and engagement activity |
| Assets | Browse and manage the user's files |
| Bookmarks | Saved items and bookmark folders |
| Notifications | Notification list and read state |
| Profile | Account details, avatar, password |
| Subscriptions | Stripe-backed plans and sessions |
| Auth | Login, registration, logout |

The Portal is a consumer-facing counterpart to the Admin. It uses the same CMS users and session cookies.

---

## Setup

From the repository root:

```bash
npm install
npm run build:shared
npm run dev:portal
```

Vite starts on its default port `5173` with `--host 127.0.0.1`. Open `http://127.0.0.1:5173/portal/`.

> The Portal has **no dev proxy**. During local development, either:
>
> - build it and load it through the Fastify service at `http://127.0.0.1:3001/portal/`, or
> - set `VITE_REACT_APP_API_URL` to the CMS origin and configure CMS CORS.

Do not run `dev:app`, `dev:admin`, and `dev:portal` simultaneously on the default port; Vite will pick another port or fail.

---

## Configuration

`src/config.ts` reads build-time Vite variables:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_REACT_APP_API_URL` | `''` (same origin) | CMS API origin; also used for activity, notifications, and subscriptions |
| `VITE_REACT_APP_ASSET_URL` | `''` (same origin) | Asset origin for uploaded files |
| `VITE_REACT_APP_PORTAL` | `/portal` | Route prefix |

Example `.env.local`:

```bash
VITE_REACT_APP_API_URL=http://127.0.0.1:5000
VITE_REACT_APP_ASSET_URL=http://127.0.0.1:5000
VITE_REACT_APP_PORTAL=/portal
```

All requests use cookies (`axios.defaults.withCredentials = true`). If the API is cross-origin, add the Portal origin in **Studio → Settings → CORS**.

Stripe publishable keys are configured by the CMS subscription settings, not by this app.

---

## Build

```bash
npm run build --workspace=@cms/portal
```

Output: `packages/portal/dist`.

The Fastify service serves it at `/portal/`. `vite.config.ts` sets `base: '/portal/'`.

---

## Notes and limitations

- No dev proxy is defined.
- Subscription flows depend on CMS configuration and Stripe keys; the Portal only renders the client side.
- There is no automated test suite for this workspace.

---

## Related

- [Architecture](../../docs/wiki/Architecture.md)
- [Engagement Features](../../docs/wiki/Engagement-Features.md)
- [API Reference](../../docs/wiki/API-Reference.md)
- [Repository Structure](../../docs/wiki/Repository-Structure.md)
