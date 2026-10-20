---
name: Build CMS React App
description: Guidelines and patterns for building React applications that integrate with the CMS REST and GraphQL APIs.
---

# Building a React App with CMS

These patterns apply to an external React app that consumes the CMS. The CMS owns `/api` and `/graphql`; the Fastify service owns `/cmsapi` and is only needed for the AI Studio.

## 1. Configuration

Prefer same-origin requests through a dev proxy. Use Vite environment variables only when the API lives on another origin.

### `src/config.ts`

```typescript
export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
};
```

Same origin (recommended):

```bash
# .env.local — leave empty to use relative /api paths
VITE_API_BASE_URL=
```

Separate CMS origin:

```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
```

If you use a separate origin, configure CMS CORS and keep cookies in mind. Mixing `localhost` and `127.0.0.1` splits cookies.

### Vite proxy

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

The default CMS target in this repository is `http://127.0.0.1:5000`. The Fastify service runs on `3001`, but it is not the data API.

## 2. Authentication

CMS uses cookie-based authentication. Include `credentials: 'include'` on every request, including GETs.

### Auth context

Create `src/contexts/AuthContext.tsx` and centralize session handling:

- **Check session:** `GET /api/me`
- **Login:** `POST /api/login` with `{ usernameOrEmail, password }`
- **Register:** `POST /api/register`
- **Logout:** `POST /api/logout`

Example login:

```typescript
const res = await fetch(`${CONFIG.API_BASE_URL}/api/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ usernameOrEmail, password }),
});
if (!res.ok) throw new Error('Login failed');
```

Do not assume the response shape beyond a successful status. Inspect the actual CMS response and type it explicitly.

Guest access is a CMS/demo feature, not a general contract. Only use it when your backend explicitly supports it.

## 3. Data fetching

There are two main API types: **entity APIs** and **named queries**.

### Entity API

| Operation | Request |
|---|---|
| List | `GET /api/entities/{entityName}` |
| Get one | `GET /api/entities/{entityName}/{id}` |
| Insert | `POST /api/entities/{entityName}/insert` |
| Update | `POST /api/entities/{entityName}/update` |
| Delete | `POST /api/entities/{entityName}/delete` |
| Lookup options | `GET /api/entities/lookup/{entityName}` |
| Publish/unpublish | `POST /api/entities/{entityName}/publication` |

Example insert:

```typescript
await fetch(`${CONFIG.API_BASE_URL}/api/entities/goal/insert`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    targetValue: 5,
    title: 'New Goal',
  }),
});
```

List responses commonly include `{ items, totalRecords }`, but the envelope is owned by the CMS. Verify it against a real response before relying on it.

### Named queries

Saved queries are exposed by ID:

```text
GET /api/queries/{queryId}
```

Some CMS builds also accept a query name and a `/single` suffix, as the Zen demo does:

```typescript
const response = await fetch(
  `${CONFIG.API_BASE_URL}/api/queries/habitTemplateById/single?id=${id}`,
  { credentials: 'include' }
);
```

Treat that as a CMS-owned convention, not a guarantee. Check the query endpoint shown in the Studio.

### GraphQL

```typescript
await fetch(`${CONFIG.API_BASE_URL}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ query: '{ books { id title } }' }),
});
```

Use GraphiQL in the Studio to introspect the schema.

## 4. Assets

Uploaded files are served from `/files/...`. Asset fields are usually objects:

```tsx
<img src={record.coverImage?.url} alt="" />
```

Do not treat an asset field as a bare string unless you have verified the schema.

## 5. UI conventions

These are optional, not enforced by CMS:

- **Lucide React** for icons.
- **Framer Motion** for transitions.
- Consistent spacing and a small, intentional color palette.

Use the existing Admin or Portal code as a reference for PrimeReact, and the Studio for Tailwind.

## 6. Checklist

- [ ] Dev proxy sends `/api`, `/graphql`, and `/files` to the CMS.
- [ ] Every request uses `credentials: 'include'`.
- [ ] No hardcoded `localhost:3001` as the data API.
- [ ] Endpoint paths come from `@cms/shared` constants when inside this monorepo.
- [ ] Asset fields are accessed via `.url`.
- [ ] Response types match a real response, not an assumption.
