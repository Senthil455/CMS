# Docker Deployment

CMS ships as a **single image containing two runtimes**:

- Nginx on port `5000` as the gateway;
- the Node.js/Fastify service on `3001`;
- the ASP.NET Core CMS on `5001`;
- ffmpeg for media conversion.

The database is either SQLite inside `/data` or an external PostgreSQL/MySQL/SQL Server instance.

> The .NET CMS source is **not in this repository**. The image build expects a sibling `CMS` checkout and a published `CMS/publish` directory. Pulling the published image avoids this requirement.

---

## 1. Route table

Nginx (`mono-deploy-local/nginx.conf`) uses these rules:

| Location | Upstream | Notes |
|---|---|---|
| `~ ^/(app\|admin\|portal\|stash\|cmsapi\|static)/` | Node `:3001` | **Trailing slash required** |
| `~ ^/files/` | .NET `:5001` | Uploaded assets |
| `/api/` | .NET `:5001` | CMS REST API |
| `/` | .NET `:5001` | CMS UI, setup wizard, generated pages, `/graphql` |

WebSocket upgrade headers are set globally, so `/cmsapi/socket.io` works through Nginx.

Important consequences:

- `/app` without a trailing slash falls through to the CMS, not the Studio.
- `/graphql` is served directly by the CMS in Docker; the Fastify `/graphql` proxy is used in local development.
- Nginx intercepts 502 errors on `/api/` and returns a 503 "system is restarting" message while the .NET process restarts.

---

## 2. Quick start (published image)

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

1. `entrypoint.sh` writes `${CMS_DATA_PATH}/config/cms.settings.json` if it does not exist.
2. SQLite is used if `DATABASE_PROVIDER=0`.
3. The setup wizard creates the Super Admin.
4. Add an AI key under **Settings → AI Providers**.

### Ephemeral mode

Without `-v cms_data:/data`, everything is lost when the container is removed. The image still runs; this is useful only for demos.

---

## 3. Compose with PostgreSQL

`mono-deploy-local/docker-compose.yml` (and `mono-deploy-hub/docker-compose.prod.yml`) run the app plus PostgreSQL:

```yaml
services:
  app:
    image: senthil455/cms-mono:latest   # local file uses build: instead
    ports:
      - "${APP_PORT:-5000}:5000"
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
    volumes:
      - cms_data:/data
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=cms
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  cms_data:
```

Start:

```bash
docker compose up -d
```

Both `DATABASE_PROVIDER`/`CONNECTION_STRING` and the .NET-style `DatabaseProvider`/`ConnectionStrings__Postgres` variables are set. The entrypoint writes the former into `cms.settings.json`; the CMS may also read the latter directly. Keeping them consistent avoids surprises.

Change the default PostgreSQL password before exposing the service.

---

## 4. Environment variables

| Variable | Default | Used by |
|---|---|---|
| `DATABASE_PROVIDER` | `0` in entrypoint, `1` in Compose | CMS: `0`=SQLite, `1`=Postgres, `2`=SqlServer, `3`=MySQL |
| `CONNECTION_STRING` | `Data Source=cms.db` | CMS |
| `CMS_DATA_PATH` | unset → `/app/cms/cms.settings.json` | Entrypoint config path (`$CMS_DATA_PATH/config/cms.settings.json`) |
| `CMS_MAX_REQUEST_SIZE` | `50000000` | Nginx `client_max_body_size` |
| `MASTER_PASSWORD` | empty | Optional CMS setup password |
| `PORT` | `3001` | Fastify |
| `NODE_ENV` | `production` in Compose | Fastify |
| `CMS_BASE_URL` | `http://127.0.0.1:5001` | Fastify upstream |
| `DATABASE_URL` | `file:/app/packages/service/sessions.db` in entrypoint; Compose sets `/data/app/sqlite.db` | Prisma and sessions |
| `FRONTEND_URL` | `http://127.0.0.1:3001` in entrypoint | CORS/Socket.IO allowlist |
| `SESSION_SECRET` | built-in development fallback | Session signing; **set this in production** |

The browser reaches the app through Nginx on port 5000, so `FRONTEND_URL` normally needs to be the public origin (for example `https://cms.example.com`), not `127.0.0.1:3001`.

---

## 5. Volumes and persistence

| Volume / path | Contents | Back up? |
|---|---|---|
| `cms_data` → `/data` | `config/cms.settings.json`, `app/sqlite.db`, `cms.db` (SQLite mode), `files/`, `apps/` | Yes |
| `postgres_data` → `/var/lib/postgresql/data` | CMS database in PostgreSQL mode | Yes, via `pg_dump` rather than raw copy |
| `sessions.db` in `/app/packages/service` | Service sessions | No; users can re-authenticate |

For SQLite, keep the CMS database and the service database inside `/data` so one volume captures both. The command in the quick start does this.

### Reset

```bash
docker compose down          # keeps volumes
docker compose down -v       # deletes database and data volumes
```

To reset only the CMS configuration:

```bash
docker compose exec app rm /data/config/cms.settings.json
docker compose restart app
```

The entrypoint regenerates the file from environment variables.

---

## 6. How the image is built

### Dockerfile (`mono-deploy-local/Dockerfile`)

**Stage 1 — Node**

1. `FROM node:24-slim`
2. Copies `CMS/package.json`, `cms/package-lock.json`, and package manifests for `shared`, `service`, `app`, `sdk`.
3. Runs `npm install --omit=dev`.
4. Copies prebuilt `shared/dist`, `service/dist`, `service/src`, `resources`, `public`, `prisma`, and frontend `dist` folders.
5. Runs `npx prisma generate` on the target architecture.

**Stage 2 — runtime**

1. `FROM mcr.microsoft.com/dotnet/aspnet:10.0`
2. Installs Nginx, Node 24, `tsx`, curl, procps, dos2unix, ffmpeg.
3. Copies Nginx config and 404 page.
4. Copies the Node stage into `/app`.
5. Copies `CMS/publish` to `/app/cms`.
6. Sets `entrypoint.sh` as the entrypoint and exposes `5000`.

### Entrypoint (`entrypoint.sh`)

1. Defaults `DATABASE_URL`, `PORT`, `CMS_BASE_URL`, `FRONTEND_URL`, `DATABASE_PROVIDER`, `CONNECTION_STRING`.
2. Writes `cms.settings.json` if absent.
3. Substitutes `__MAX_REQUEST_SIZE__` in `/etc/nginx/nginx.conf`.
4. Starts Nginx.
5. Runs `npx prisma db push --accept-data-loss` and starts `tsx src/index.ts` in the background.
6. Runs `dotnet CMS.MonoApp.dll --urls http://127.0.0.1:5001` in a restart loop.

`--accept-data-loss` means schema changes can drop columns or data in the service database. Back it up before upgrading an image.

### Build scripts and path assumptions

`mono-deploy-local/build-fast.sh` and `mono-deploy-hub/build-multiarch.sh` assume:

```text
<parent>/
├── CMS/                 ← this repository, folder must be named CMS
│   ├── packages/
│   ├── publish/         ← dotnet publish output
│   └── mono-deploy-local/
└── ...
```

They do `cd "$REPO_ROOT/CMS"` and publish `server/CMS.MonoApp/CMS.MonoApp.csproj`. The Dockerfile expects the build context to contain `CMS/...` and a sibling `CMS/publish`.

`docker-compose.yml` builds with:

```yaml
context: ../../
dockerfile: cms/mono-deploy-local/Dockerfile
```

This only resolves when the repository directory is literally named `cms` (lowercase) under the parent used as context. If your checkout is named differently, the build fails with `COPY CMS/... not found`.

Older documentation referenced `build.sh` and `Dockerfile.fast`; neither exists. Use `build-fast.sh` (which calls the single `Dockerfile`) or `mono-deploy-hub/build-multiarch.sh`.

### Requirements for a source build

- Docker with Buildx for multi-arch.
- Node 24 and npm locally (the fast scripts build outside Docker).
- .NET 10 SDK locally to publish `CMS.MonoApp`.
- A sibling `CMS` source checkout that includes `server/CMS.MonoApp`.

---

## 7. Publishing a multi-arch image

From `mono-deploy-hub`:

```bash
./build-multiarch.sh
```

Environment overrides:

```bash
IMAGE_REPO=youruser/cms-mono IMAGE_TAG=v1.2.3 PLATFORMS=linux/amd64,linux/arm64 ./build-multiarch.sh
```

The script builds the Node and .NET artifacts locally, creates/uses a Buildx builder named `cms-multiarch`, and pushes to Docker Hub. It tags `latest` as well when a non-latest tag is supplied.

---

## 8. Health and operations

### Logs

```bash
docker compose logs -f app
docker compose exec app tail -f /var/log/nginx/access.log
```

Nginx logs include the upstream address, which helps distinguish Node from .NET failures.

### Startup sequence

- Nginx starts immediately.
- Prisma `db push` may take a few seconds.
- Node starts after the push.
- .NET starts in a loop and may take longer.
- During .NET restarts, `/api` returns 503 with `Retry-After: 3`.

### Backups

```bash
# PostgreSQL logical backup
docker compose exec -T db pg_dump -U postgres cms > cms.sql

# Volume archive
docker run --rm -v cms_data:/volume -v "$PWD":/backup alpine \
  tar czf /backup/cms_data.tar.gz -C /volume .
```

See [Migration Guide](../migration-guide.md) for restoring on another host.

---

## 9. Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| `COPY failed: ... CMS/package.json not found` | Build context does not contain a sibling `CMS/` directory, or the repo folder is not named `cms` for Compose | Build from the parent with a `CMS` checkout, or use the published image |
| `dotnet: CMS.MonoApp.dll not found` | `CMS/publish` was not produced | Run `dotnet publish server/CMS.MonoApp/CMS.MonoApp.csproj -c Release -o ./publish` |
| `/app` loads the CMS instead of the Studio | Missing trailing slash | Use `/app/` |
| 502 on `/api` | .NET crashed or is restarting | `docker compose logs app`; wait for the restart loop |
| 503 "system is restarting" | Nginx intercepted a 502 on `/api` | Wait a few seconds and refresh |
| Studio loads but chat is unauthorized | `FRONTEND_URL`/cookie host mismatch | Use one public origin; set `FRONTEND_URL` to it |
| Prisma error on start | Service DB permissions or schema drift | Check `/data` ownership; back up before rerunning `db push` |
| Uploads fail with 413 | Body larger than `CMS_MAX_REQUEST_SIZE` | Raise it and restart |
| Setup wizard repeats | Config not persisted | Mount `/data` and keep `CMS_DATA_PATH` stable |
| Socket.IO fails through a proxy | WebSocket upgrade stripped | Enable upgrade headers; Nginx config already includes them |

---

## 10. Security notes

- Set `SESSION_SECRET` explicitly.
- Terminate TLS in front of port 5000; the service cookie is `secure: false` by default.
- Change PostgreSQL credentials.
- Restrict access to `/app/` and `/cmsapi` — the service does not enforce CMS roles.
- AI keys are stored in plaintext in `/data/app/sqlite.db`; protect the volume.
- Do not expose the internal .NET port 5001 publicly; keep it bound to localhost inside the container.

---

## 11. Related pages

- [Setup](./Setup.md) — local development
- [Architecture](./Architecture.md) — runtime topology
- [Migration Guide](../migration-guide.md) — host-to-host move
- [Performance & Scalability](./Performance-Scalability.md) — capacity planning
