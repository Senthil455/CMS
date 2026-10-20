# Building an External Frontend (Vite + React)

CMS is headless. You can run the CMS through Docker and build any frontend you like against `/api` and `/graphql`. This guide uses Vite + React, but the API contract is framework-agnostic.

> **What you need:** a running CMS (Docker image or your own CMS deployment), and Node 20+ for the frontend.

---

## 1. Start the CMS

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

Open **http://localhost:5000/app/**, create the Super Admin, add an AI key, and create at least one entity with data.

You do **not** need to run the Fastify Studio for an external frontend. It is only needed if you want the AI builder. Your app talks to the CMS `/api` and `/graphql` routes.

---

## 2. Create the Vite app

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`.

---

## 3. Proxy the CMS in development

Use Vite's proxy so the browser sees one origin and cookies work:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/graphql': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
```

Use `127.0.0.1` consistently. If the CMS is running on another host, substitute its origin.

Every fetch should send cookies:

```typescript
fetch('/api/me', { credentials: 'include' });
```

If you build on `@cms/sdk`, it already uses same-origin paths and cookies.

---

## 4. Know the API shapes

### Authentication

| Method | Path | Body |
|---|---|---|
| `POST` | `/api/login` | `{ usernameOrEmail, password }` |
| `POST` | `/api/register` | registration fields |
| `POST` | `/api/logout` | — |
| `GET` | `/api/me` | — |
| `POST` | `/api/profile/password` | password change |
| `POST` | `/api/profile/avatar` | avatar update |

### Entity records

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/entities/:entityName` | List records (supports query filters) |
| `GET` | `/api/entities/:entityName/:id` | One record |
| `POST` | `/api/entities/:entityName/insert` | Insert |
| `POST` | `/api/entities/:entityName/update` | Update |
| `POST` | `/api/entities/:entityName/delete` | Delete |
| `GET` | `/api/entities/lookup/:entityName` | Lookup options |
| `POST` | `/api/entities/:entityName/publication` | Publish/unpublish |

The exact filter syntax and response envelope come from the CMS. Inspect a request in the Studio's API tester, or query GraphQL introspection.

### Named queries

Saved queries are exposed at:

```text
GET /api/queries/:id
```

Use the ID shown in the Studio's query detail/endpoint preview. Pages use:

```text
GET /api/page-data?id=<schemaId>
```

### GraphQL

```text
POST /graphql
Content-Type: application/json

{ "query": "{ books { id title } }" }
```

Use the GraphiQL panel in the Studio (or any GraphQL client) to introspect the schema.

### Assets

Uploaded files are served from `/files/...` and managed through `/api/assets`. Asset fields in records are objects; use `.url` in UI code.

---

## 5. Build the UI

Example list component:

```tsx
import { useEffect, useState } from 'react';

type Book = { id: number; title: string; price?: number };

export function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/entities/book', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setBooks(data.items ?? data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Failed to load: {error}</p>;
  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>{book.title}</li>
      ))}
    </ul>
  );
}
```

Login form:

```tsx
async function login(usernameOrEmail: string, password: string) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}
```

Prefer `@cms/sdk` if you want ready-made hooks and services. It is a source workspace, not a published npm package in this repository.

---

## 6. Use AI agents to write the frontend

Once entities exist, give your coding agent the concrete schema and endpoints:

> *"Create a `BookList` page using the existing `/api/entities/book` endpoint. Fields are `id`, `title`, `price`, `coverImage.url`. Include loading, empty, and error states. Use Tailwind."*

Good prompts include:

- the exact entity name and field list,
- the endpoint or GraphQL query,
- auth requirements,
- the desired framework and styling,
- pagination/filter expectations.

Avoid asking an agent to "build the backend" in the external frontend repository; the backend is the CMS.

---

## 7. CORS if you do not use a proxy

If the browser calls the CMS directly from a different origin, add your frontend origin in **Studio → Settings → CORS**. The setting is stored by the CMS (`/api/system/cors`) and the CMS restarts to apply it. Broad origins plus cookies are a security risk; prefer the same-origin proxy in production.

---

## 8. Deploy the frontend with CMS

The CMS can serve a built SPA directly:

1. Build:
   ```bash
   npm run build
   ```
2. Zip the **contents** of `dist` so `index.html` is at the archive root.
3. In the Studio, open **Settings → Frontend Apps**.
4. Upload the zip, or upload a folder (the UI zips it), and choose the public path and directory name.
5. The CMS stores it under its apps directory and serves it at the chosen path.

This is convenient for demos and single-server deployments. For production, a CDN or static host is usually a better fit; the CMS is not a general-purpose CDN.

---

## 9. Iterate

```text
Change the data model in CMS (AI or manual)
  → update the query
  → regenerate or edit frontend components
  → rebuild and deploy
```

Keep generated frontends under version control. The CMS stores schemas and content, not your React source.

---

## 10. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `401` on every call | Cookies not sent or wrong host | `credentials: 'include'`; use one host |
| CORS error | Direct cross-origin call | Use the Vite proxy or configure CMS CORS |
| `404` on an entity | Entity name mismatch | Check the schema name in the Studio |
| Empty list | No data or a filter mismatch | Seed data; inspect the query response |
| Images broken | Asset is an object | Use `coverImage.url`, not `coverImage` |
| GraphQL validation error | Field names differ | Introspect the schema in GraphiQL |

---

## 11. Related pages

- [Setup](./Setup.md) — CMS and Studio setup
- [API Reference](./API-Reference.md) — route inventory
- [Building a System](./Building-a-System.md) — create entities, data, and queries
- [Antigravity Integration](../antigravity-integration.md) — agent workflows and current limitations
