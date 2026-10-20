# CMS

**AI-assisted headless CMS and app builder** — schema design, sample data, GraphQL queries, and pages, plus a React admin, an end-user portal, and an offline-first PWA.

The image bundles:

- **Nginx** on port `5000` as the gateway;
- **CMS Studio** at `/app/` (Node.js + Fastify + React);
- **CMS Admin** at `/admin/`;
- **CMS Portal** at `/portal/`;
- **Stash**, an installable offline PWA, at `/stash/`;
- an **ASP.NET Core CMS** on internal port `5001`, which owns entities, records, queries, pages, auth, roles, assets, and GraphQL;
- **ffmpeg** for media conversion.

> The .NET CMS source is not in the public repository. The published image is the supported way to run the complete product.

---

## 1. Quick start (SQLite, no external database)

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

Open **http://localhost:5000/app/**.

First run:

1. Confirm the SQLite database.
2. Create the Super Admin.
3. Add a Gemini or OpenAI API key under **Settings → AI Providers**.
4. Start building a schema.

### Ephemeral mode

```bash
docker run -d --name cms -p 5000:5000 senthil455/cms-mono:latest
```

Without a volume, everything is lost when the container is removed. Use this only for demos.

---

## 2. Production Compose with PostgreSQL

```yaml
services:
  app:
    image: senthil455/cms-mono:latest
    ports:
      - "5000:5000"
    environment:
      - DATABASE_PROVIDER=1
      - CONNECTION_STRING=Host=db;Port=5432;Database=cms;Username=postgres;Password=postgres;
      - DatabaseProvider=Postgres
      - "ConnectionStrings__Postgres=Host=db;Database=cms;Username=postgres;Password=postgres;"
      - CMS_DATA_PATH=/data
      - PORT=3001
      - NODE_ENV=production
      - CMS_BASE_URL=http://127.0.0.1:5001
      - DATABASE_URL=file:/data/app/sqlite.db
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - cms_data:/data

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=cms
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  cms_data:
  postgres_data:
```

```bash
docker compose up -d
docker compose logs -f app
```

Change the default PostgreSQL password before exposing the service, and set `FRONTEND_URL` to the public origin.

---

## 3. Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_PROVIDER` | `0` in entrypoint, `1` in the sample Compose | `0`=SQLite, `1`=Postgres, `2`=SqlServer, `3`=MySQL |
| `CONNECTION_STRING` | `Data Source=cms.db` | CMS database connection |
| `CMS_DATA_PATH` | unset → `/app/cms/cms.settings.json` | Config path; with `/data`, settings are written to `/data/config/cms.settings.json` |
| `CMS_MAX_REQUEST_SIZE` | `50000000` | Nginx request body limit |
| `PORT` | `3001` | Fastify port |
| `CMS_BASE_URL` | `http://127.0.0.1:5001` | Internal CMS origin used by Fastify |
| `DATABASE_URL` | `file:/app/packages/service/sessions.db` | Fastify Prisma database |
| `FRONTEND_URL` | `http://127.0.0.1:3001` | CORS / Socket.IO allowlist |
| `SESSION_SECRET` | development fallback | Session signing; set it in production |
| `MASTER_PASSWORD` | empty | Optional CMS setup password |

AI provider keys are **not** environment variables. They are stored in the service SQLite database and managed from **Settings → AI Providers**. Keys are currently stored in plaintext, so protect the `/data` volume.

---

## 4. Routing

| Path | Served by | Purpose |
|---|---|---|
| `/app/` | Node `:3001` | CMS Studio |
| `/admin/` | Node `:3001` | CMS Admin |
| `/portal/` | Node `:3001` | End-user portal |
| `/stash/` | Node `:3001` | Offline PWA |
| `/static/` | Node `:3001` | Browser SDK for generated pages |
| `/cmsapi/*` | Node `:3001` | Chat, Socket.IO, AI providers, tasks |
| `/api/*` | .NET `:5001` | CMS REST API |
| `/files/*` | .NET `:5001` | Uploaded assets |
| `/`, `/graphql` | .NET `:5001` | CMS UI, setup, generated pages, GraphQL |

The trailing slash matters for the Node prefixes. `/app` without it reaches the CMS instead of the Studio.

---

## 5. Persistence

The `/data` volume can contain:

| Path | Contents |
|---|---|
| `config/cms.settings.json` | CMS database settings |
| `cms.db` | CMS SQLite database (when configured here) |
| `app/sqlite.db` | Fastify service database (chat, AI logs, settings, tasks) |
| `files/` | Uploaded assets |
| `apps/` | Uploaded SPA bundles |

Back up the volume before upgrading. The entrypoint runs `prisma db push --accept-data-loss`, which can change the service database schema.

```bash
docker run --rm -v cms_data:/volume -v "$PWD":/backup alpine \
  tar czf /backup/cms_data.tar.gz -C /volume .
```

For PostgreSQL, use `pg_dump` rather than copying the data directory.

---

## 6. Security

- Set `SESSION_SECRET`.
- Terminate TLS in front of port `5000`; the Fastify cookie is `secure: false` by default.
- Change PostgreSQL credentials.
- Restrict `/app/` and `/cmsapi` to trusted users. The service validates authentication but does not enforce CMS roles on those routes.
- Keep port `5001` internal.
- Protect `/data/app/sqlite.db`; it contains AI keys in plaintext.

---

## 7. Links

- **GitHub:** [https://github.com/Senthil455/CMS](https://github.com/Senthil455/CMS)
- **Documentation:** [https://github.com/Senthil455/CMS/tree/main/docs/wiki](https://github.com/Senthil455/CMS/tree/main/docs/wiki)
- **Docker deployment guide:** [Docker-Deployment.md](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Docker-Deployment.md)
- **Migration guide:** [migration-guide.md](https://github.com/Senthil455/CMS/blob/main/docs/migration-guide.md)

Tags follow `latest` plus version tags pushed by `mono-deploy-hub/build-multiarch.sh` (`IMAGE_TAG`).
