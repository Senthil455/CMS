# `@cms/sdk`

Internal React integration layer for CMS. It provides hooks, services, page logic, and routers used by CMS Admin, Portal, and Stash.

> **Not published to npm.** This workspace is consumed directly as TypeScript source. `package.json` points `main` and `types` at `index.ts`, and there is **no build script**. Do not run `npm run build:sdk`.

---

## What is in the package

| Directory | Contents |
|---|---|
| `auth/` | Session hook, login/register pages, password and avatar pages, users, roles, routers |
| `cms/` | Entity and query clients, data list/item pages, asset pages and services, task pages, `EntityRouter` |
| `components/` | Shared React data, input, and UI components |
| `containers/` | Higher-level layout containers |
| `engagements/` | Activity and bookmark services, types, and page hooks |
| `notifications/` | Notification types and page hook |
| `sub/` | Subscription/Stripe types and configuration |
| `auditLog/` | Audit log pages, router, and API config |
| `dashboard/` | Dashboard page hook |
| `hooks/` | Data-table state and menu helpers |
| `types/` | Shared types and formatters |
| `utils/` | Utilities |
| `ComponentConfig.tsx` | Global component configuration types |

`index.ts` is the public entry point. Some configuration helpers live in subpaths, for example `@cms/sdk/notifications/config` and `@cms/sdk/sub/config`.

---

## Usage

The SDK is an npm workspace, so other workspaces import it by package name:

```json
{
  "dependencies": {
    "@cms/sdk": "*"
  }
}
```

```tsx
import {
  setAuthApiBaseUrl,
  setCmsApiBaseUrl,
  useUserInfo,
  useDataListPage,
} from '@cms/sdk';

// Same origin (recommended through the Fastify service or a dev proxy)
setAuthApiBaseUrl('');
setCmsApiBaseUrl('');

function Profile() {
  const { data } = useUserInfo();
  return data ? <span>{data.username}</span> : null;
}
```

### Base URL configuration

Call the setters once at application startup:

| Setter | Used for |
|---|---|
| `setAuthApiBaseUrl(url)` | Login, session, profile, users, roles |
| `setCmsApiBaseUrl(url)` | Entity and asset APIs |
| `setAuditLogBaseUrl(url)` | Audit log APIs |
| `setActivityBaseUrl(url)` | Engagement/activity APIs |
| `setNotificationBaseUrl(url)` (subpath) | Notifications |
| `setSubBaseUrl(url)` (subpath) | Subscriptions |

The default is an empty string, which means **same origin**. Axios clients are created with `withCredentials: true`, so cookies flow when the API shares the origin.

### Routers

| Router | Purpose |
|---|---|
| `AuthRouter` | Login/register routing |
| `EntityRouter` | Entity list/detail/edit routing |
| `AccountRouter` | Account pages |
| `ProfileRouter` | Profile pages |
| `AuditLogRouter` | Audit log pages |

---

## Peer dependencies

The SDK expects the host app to provide:

- React 19
- `react-router-dom` 6
- `react-hook-form` 7

Admin and Portal satisfy these. An external project must install them itself.

`@cms/shared` is a runtime dependency. Build it first (`npm run build:shared`) after changing shared types or endpoints.

---

## Development notes

- Edit source and let the consuming workspace hot-reload; there is no package build.
- The SDK has no tests and no lint script.
- Because it is source-only, changes can break all three consumers at once. Run the consumer builds after editing shared hooks or types.
- `packages/sdk` is listed in the root `workspaces`, so `npm install` at the root links it.

---

## Related

- [Repository Structure](../../docs/wiki/Repository-Structure.md)
- [API Reference](../../docs/wiki/API-Reference.md)
- [Architecture](../../docs/wiki/Architecture.md)
