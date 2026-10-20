# Local Single-Image Deployment

This directory builds and runs CMS as one container: Nginx on `5000`, the Node/Fastify service on `3001`, and the ASP.NET Core CMS on `5001`.

> **Source boundary:** the .NET CMS source is not in this repository. `build-fast.sh` expects a sibling checkout at `$REPO_ROOT/CMS` and a published `CMS/publish` directory. Pulling `senthil455/cms-mono:latest` avoids both requirements.

---

## 1. Quick start (published image)

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

Open **http://localhost:5000/app/** and complete the setup wizard:

1. Confirm SQLite (or enter another provider).
2. Create the Super Admin.
3. Add a Gemini or OpenAI key under **Settings → AI Providers**.

Without `-v cms_data:/data`, all data is lost when the container is removed.

---

## 2. Compose with PostgreSQL

`docker-compose.yml` starts two services:

- `app` — the CMS image, built locally or supplied as `cms-mono-deploy:latest`;
- `db` — PostgreSQL 15 with a `postgres_data` volume.

```bash
docker compose up -d
docker compose logs -f app
```

Default ports:

| Variable | Default | Purpose |
|---|---|---|
| `APP_PORT` | `5000` | Published gateway port |
| `DB_PORT` | `5432` | Published PostgreSQL port |

```bash
APP_PORT=8080 DB_PORT=5433 docker compose up -d
```

The Compose file sets both CMS-style and .NET-style database variables:

```yaml
- DATABASE_PROVIDER=1
- CONNECTION_STRING=Host=db;Port=5432;Database=cms;Username=postgres;Password=postgres;
- DatabaseProvider=Postgres
- "ConnectionStrings__Postgres=Host=db;Database=cms;Username=postgres;Password=postgres;"
```

`entrypoint.sh` writes `DATABASE_PROVIDER` and `CONNECTION_STRING` into `cms.settings.json`. Keep the two styles consistent.

Change the default PostgreSQL password before exposing the service.

---

## 3. Files in this directory

| File | Purpose |
|---|---|
| `Dockerfile` | Two stages: Node 24 build/copy, then the .NET 10 ASP.NET runtime with Node, Nginx, `tsx`, and ffmpeg |
| `docker-compose.yml` | App + PostgreSQL, `/data` volume, `APP_PORT` / `DB_PORT` |
| `entrypoint.sh` | Writes CMS settings, renders the Nginx body-size limit, starts Nginx, runs Prisma `db push`, starts `tsx`, runs the .NET loop |
| `nginx.conf` | Port 5000 gateway and route table |
| `build-fast.sh` | Builds workspaces locally, publishes the external .NET app, then runs `docker build` |
| `reload.sh` | Recreates the `app` service and publishes it on **port 8001** |
| `reload_zen.sh` | Recreates a `zen` Compose project on **port 8000**, PostgreSQL on `5433` |
| `404.html` | Static 404 page |

There is **no** `build.sh` and **no** `Dockerfile.fast` in this checkout. Older docs referenced both; use `build-fast.sh` and `Dockerfile`.

---

## 4. Building the image locally

### 4.1 Fast build

```bash
./build-fast.sh
./reload.sh
```

`build-fast.sh` performs these steps:

1. `cd "$REPO_ROOT/CMS"` and `npm install`.
2. Build `@cms/shared`, `@cms/app`, `@cms/admin`, `@cms/portal`, and `@cms/stash`.
3. `cd packages/service`, install dependencies, run `npx prisma generate`, and `npm run build`.
4. `dotnet publish server/CMS.MonoApp/CMS.MonoApp.csproj -c Release -o ./publish` in the external CMS checkout.
5. `docker build -t cms-mono-deploy:latest -f Dockerfile "$REPO_ROOT"`.

Requirements:

- Node.js 24 and npm;
- the .NET 10 SDK;
- a sibling `CMS` checkout containing `server/CMS.MonoApp`;
- enough disk space for the Node and .NET artifacts.

### 4.2 Path assumptions (read before building)

The scripts and the Dockerfile assume a layout like this:

```text
<parent>/
├── CMS/                     ← repository folder, uppercase
│   ├── packages/
│   ├── publish/             ← dotnet publish output
│   └── mono-deploy-local/
└── ...
```

`build-fast.sh` computes:

```bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$SCRIPT_DIR/../.."
cd "$REPO_ROOT/CMS"
```

If the checkout folder is named `formmate`, the script looks for `<parent>/CMS`, not `<parent>/formmate`. Either rename the checkout to `CMS` for the build, create a symlink, or use the published image.

The Dockerfile uses `COPY CMS/package.json`, `COPY CMS/packages/...`, and `COPY CMS/publish`, so the Docker build context must be the **parent** directory that contains `CMS/`.

Compose is stricter on case-sensitive systems:

```yaml
build:
  context: ../../
  dockerfile: cms/mono-deploy-local/Dockerfile
```

It expects a lowercase `cms/` directory in the parent, while `build-fast.sh` expects uppercase `CMS/`. On Linux, at most one of the two paths can resolve. On Windows and macOS the filesystem is usually case-insensitive, so both may appear to work.

If you do not need a local build, use the published image and skip this section.

### 4.3 Multi-architecture publishing

Use [`mono-deploy-hub/build-multiarch.sh`](../mono-deploy-hub/build-multiarch.sh):

```bash
cd ../mono-deploy-hub
./build-multiarch.sh
```

It has the same sibling-`CMS` assumptions, creates a Buildx builder named `cms-multiarch`, and pushes `senthil455/cms-mono` for `linux/amd64,linux/arm64` by default.

---

## 5. Nginx routes

`nginx.conf` listens on `5000`:

| Location | Upstream | Notes |
|---|---|---|
| `~ ^/(app\|admin\|portal\|stash\|cmsapi\|static)/` | Node `127.0.0.1:3001` | Trailing slash required |
| `~ ^/files/` | .NET `127.0.0.1:5001` | Uploaded assets |
| `/api/` | .NET `127.0.0.1:5001` | CMS REST API; 502 is converted to 503 |
| `/` | .NET `127.0.0.1:5001` | CMS UI, setup, generated pages, `/graphql` |

WebSocket upgrade headers are configured globally, so Socket.IO works at `/cmsapi/socket.io`.

Consequences:

- `/app` without a trailing slash falls through to the CMS, not the Studio.
- `/graphql` is served directly by the CMS in this image; the Fastify proxy is only used during local development.
- During a .NET restart, `/api` returns `503` with `Retry-After: 3` instead of a raw 502.

---

## 6. Environment variables

| Variable | Default | Used by |
|---|---|---|
| `DATABASE_PROVIDER` | `0` in entrypoint, `1` in Compose | CMS: `0`=SQLite, `1`=Postgres, `2`=SqlServer, `3`=MySQL |
| `CONNECTION_STRING` | `Data Source=cms.db` | CMS |
| `CMS_DATA_PATH` | unset → `/app/cms/cms.settings.json` | Entrypoint config path |
| `CMS_MAX_REQUEST_SIZE` | `50000000` | Nginx `client_max_body_size` |
| `MASTER_PASSWORD` | empty | Optional CMS setup password |
| `PORT` | `3001` | Fastify |
| `NODE_ENV` | `production` in Compose | Fastify |
| `CMS_BASE_URL` | `http://127.0.0.1:5001` | Fastify upstream |
| `DATABASE_URL` | `file:/app/packages/service/sessions.db` | Prisma and sessions |
| `FRONTEND_URL` | `http://127.0.0.1:3001` | CORS / Socket.IO allowlist |
| `SESSION_SECRET` | development fallback | Session signing; set it in production |

The browser reaches the app through Nginx on `5000`. In production, set `FRONTEND_URL` to the public origin (for example `https://cms.example.com`), not `127.0.0.1:3001`.

---

## 7. Start sequence and volumes

`entrypoint.sh`:

1. defaults the environment variables;
2. writes `$CMS_DATA_PATH/config/cms.settings.json` if missing;
3. substitutes `__MAX_REQUEST_SIZE__` in `/etc/nginx/nginx.conf`;
4. starts Nginx;
5. runs `npx prisma db push --accept-data-loss` and starts `tsx src/index.ts &`;
6. runs `dotnet CMS.MonoApp.dll --urls http://127.0.0.1:5001` in a loop, restarting after one second.

The `/data` volume holds:

| Path | Contents |
|---|---|
| `config/cms.settings.json` | CMS database configuration |
| `cms.db` | CMS SQLite database (when configured here) |
| `app/sqlite.db` | Fastify service database |
| `files/` | Uploaded assets |
| `apps/` | Uploaded SPA bundles |

Service sessions live in `/app/packages/service/sessions.db`, outside `/data`, and are lost when the container is recreated.

Reset behavior:

```bash
docker compose down       # keeps volumes
docker compose down -v    # deletes volumes
```

Reset only the CMS configuration:

```bash
docker compose exec app rm /data/config/cms.settings.json
docker compose restart app
```

`--accept-data-loss` means Prisma can drop service columns or data during an upgrade. Back up `/data/app/sqlite.db` first.

---

## 8. Reload scripts

`reload.sh`:

```bash
docker compose stop app
docker compose rm -f app
docker compose up -d app
```

It exports `APP_PORT=8001`, so the reloaded stack is available at `http://localhost:8001`, not `5000`.

`reload_zen.sh` sets:

```bash
COMPOSE_PROJECT_NAME=zen
APP_PORT=8000
DB_PORT=5433
```

and is intended for a second, isolated environment.

---

## 9. Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| `COPY failed: ... CMS/package.json not found` | Build context does not contain a sibling `CMS/` checkout | Build from the parent with the checkout present, or use the published image |
| `dotnet: CMS.MonoApp.dll not found` | `CMS/publish` was not produced | Publish the external CMS project before building |
| `/app` shows the CMS UI | Missing trailing slash | Use `/app/` |
| 502 on `/api` | .NET crashed or is restarting | `docker compose logs app`; wait for the loop |
| 503 "system is restarting" | Nginx intercepted a 502 on `/api` | Refresh after a few seconds |
| Chat unauthorized | Cookie/host mismatch or missing `FRONTEND_URL` | Use one origin; set `FRONTEND_URL` to it |
| Prisma error on start | Service DB permissions or schema drift | Check `/data` ownership; back up before rerunning |
| Uploads fail with 413 | Body exceeds `CMS_MAX_REQUEST_SIZE` | Raise it and restart |
| Setup wizard repeats | Config not persisted | Mount `/data` and keep `CMS_DATA_PATH` stable |
| `reload.sh` opens the wrong port | It sets `APP_PORT=8001` | Use `http://localhost:8001` or unset the override |

---

## 10. Security

- Set `SESSION_SECRET` explicitly.
- Terminate TLS in front of port `5000`; the service cookie is `secure: false` by default.
- Change the default PostgreSQL credentials.
- Restrict access to `/app/` and `/cmsapi`; the service authenticates but does not enforce CMS roles.
- AI keys are stored in plaintext in `/data/app/sqlite.db`.
- Do not publish port `5001`; it is the internal .NET listener.

---

## 11. Related documentation

- [Docker Deployment](../docs/wiki/Docker-Deployment.md)
- [Migration Guide](../docs/migration-guide.md)
- [Architecture](../docs/wiki/Architecture.md)
- [Repository Structure](../docs/wiki/Repository-Structure.md)
