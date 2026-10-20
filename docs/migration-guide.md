# Migration and Host-to-Host Deployment

This guide moves a CMS deployment from one Docker host to another. It covers the two data stores that matter and the image itself.

> **Important:** the image build expects an ASP.NET Core CMS checkout that is **not in this repository**. If you use the published image (`senthil455/cms-mono:latest`), you can skip the build section entirely.

---

## 1. What has to move

| Artifact | Contains | Transfer method |
|---|---|---|
| Docker image | Node/Fastify service, .NET CMS, Nginx, ffmpeg | `docker save` → copy → `docker load`, or pull from Docker Hub |
| CMS data volume | CMS config, uploads, generated apps, SQLite databases | `tar` from a helper container → copy → extract |
| PostgreSQL dump | CMS relational data when `DATABASE_PROVIDER=1` | `pg_dump` → copy → `psql` restore |
| Service `sessions.db` | Login sessions for the Fastify service | **Do not migrate**; users sign in again |

`sessions.db` is created in the service working directory (`/app/packages/service` in the image) and is not part of the `/data` volume. Treat it as disposable.

---

## 2. Identify the real volume names

Compose prefixes volume names with the project name. The default project name is the directory containing the Compose file, unless `COMPOSE_PROJECT_NAME` is set.

```bash
docker compose ls
docker volume ls
```

Examples:

| How it was started | Likely volume names |
|---|---|
| `docker compose up` in `mono-deploy-local/` | `mono-deploy-local_cms_data`, `mono-deploy-local_postgres_data` |
| `COMPOSE_PROJECT_NAME=zen ./reload_zen.sh` | `zen_cms_data`, `zen_postgres_data` |
| `docker run -v cms_data:/data ...` | `cms_data` |

Use the names that `docker volume ls` actually shows. The commands below use `CMS_VOLUME` and `PG_VOLUME` variables so you can substitute them once.

```bash
CMS_VOLUME=mono-deploy-local_cms_data
PG_VOLUME=mono-deploy-local_postgres_data
```

---

## 3. Back up the source host

### 3.1 PostgreSQL (only if used)

```bash
docker compose exec -T db pg_dump -U postgres cms > cms.sql
```

`pg_dump` produces a logical SQL file that is portable across hosts and architectures. Do not copy the PostgreSQL data directory; it is binary, version-specific, and unsafe to snapshot while the server is running.

If your database name or user differs, adjust `-U` and the database argument.

### 3.2 CMS data volume

```bash
docker run --rm \
  -v "$CMS_VOLUME":/volume \
  -v "$PWD":/backup \
  alpine tar czf /backup/cms_data.tar.gz -C /volume .
```

The archive can include:

| Path inside `/data` | Contents |
|---|---|
| `config/cms.settings.json` | Database provider and connection string written by `entrypoint.sh` |
| `cms.db` | CMS database when `DATABASE_PROVIDER=0` and the connection string points here |
| `app/sqlite.db` | Fastify service database (chat history, AI logs, settings, tasks) |
| `files/` | Uploaded assets |
| `apps/` | SPA bundles uploaded through **Settings → Frontend Apps** |

The exact SQLite filenames depend on `CONNECTION_STRING` and `DATABASE_URL`. Inspect the volume before assuming:

```bash
docker run --rm -v "$CMS_VOLUME":/volume alpine ls -laR /volume
```

### 3.3 Service sessions

Skip `sessions.db`. It lives outside `/data` and contains only session records.

### 3.4 Image

Published image:

```bash
docker pull senthil455/cms-mono:latest
```

Self-built image:

```bash
./build-fast.sh
docker save cms-mono-deploy:latest | gzip > app_image.tar.gz
```

`build-fast.sh` requires:

- Node 24 and npm;
- the .NET 10 SDK;
- a sibling `CMS` checkout with `server/CMS.MonoApp/CMS.MonoApp.csproj`;
- a repository folder literally named `CMS` (the script does `cd "$REPO_ROOT/CMS"`).
- the Docker build context to contain `CMS/package.json` and `CMS/publish` (the Dockerfile uses `COPY CMS/...`).

If your checkout is named differently, use the published image or fix the paths before building. See [Docker Deployment](./wiki/Docker-Deployment.md#build-scripts-and-path-assumptions).

### 3.5 Bundle for transfer

```bash
tar czf cms-transfer.tar.gz cms.sql cms_data.tar.gz app_image.tar.gz
scp cms-transfer.tar.gz user@server:/srv/cms/
```

Omit `cms.sql` in SQLite mode and omit `app_image.tar.gz` when pulling the published image.

---

## 4. Restore on the target host

All commands assume the files are in the current directory on the server.

### 4.1 Load the image

```bash
docker load -i app_image.tar.gz
docker images | grep cms-mono
```

When using Docker Hub instead:

```bash
docker pull senthil455/cms-mono:latest
```

### 4.2 Create or reuse the data volume

```bash
docker volume create "$CMS_VOLUME"
docker run --rm \
  -v "$CMS_VOLUME":/volume \
  -v "$PWD":/backup \
  alpine sh -c "rm -rf /volume/* && tar xzf /backup/cms_data.tar.gz -C /volume"
```

`rm -rf /volume/*` gives you a clean target. Do not run it against a volume that already contains data you need.

### 4.3 Start PostgreSQL first (only if used)

```bash
docker compose up -d db
until docker compose exec -T db pg_isready -U postgres; do
  sleep 2
done
```

### 4.4 Restore the dump

```bash
docker compose exec -T db dropdb -U postgres --if-exists cms
docker compose exec -T db createdb -U postgres cms
docker compose exec -T db psql -U postgres cms < cms.sql
```

Notes:

- `-T` disables pseudo-TTY allocation, which is required when restoring over SSH or from a script.
- `dropdb` + `createdb` guarantees a clean target. Back up the target first if it already has data.
- Ensure the PostgreSQL major version on the target is the same or newer than the source.

### 4.5 Start the app

```bash
docker compose up -d app
docker compose logs -f app
```

The entrypoint:

1. writes `${CMS_DATA_PATH}/config/cms.settings.json` if it is missing;
2. starts Nginx on port `5000`;
3. runs `prisma db push --accept-data-loss` and starts the Fastify service on `3001`;
4. starts the .NET CMS on `5001` in a restart loop.

Because of `--accept-data-loss`, the service database schema can change on startup. Back up `/data/app/sqlite.db` before upgrading an image.

---

## 5. SQLite-only migration

If you run with `DATABASE_PROVIDER=0`:

1. Back up the `/data` volume as shown above.
2. Skip every PostgreSQL step.
3. Restore the volume.
4. Start the app.

Keep `CMS_DATA_PATH=/data` and `CONNECTION_STRING=Data Source=/data/cms.db` consistent between hosts. If the old container used a different path, edit `config/cms.settings.json` or delete it and let the entrypoint regenerate it from environment variables.

---

## 6. Verification

Run these checks after the restore:

```bash
# Gateway and Studio
curl -I http://localhost:5000/app/

# CMS API through Nginx
curl -I http://localhost:5000/api/system/is-ready

# Service chat status (may require auth)
curl -I http://localhost:5000/cmsapi/chat/status

# Container health
docker compose ps
docker compose logs --tail=100 app
```

Then in a browser:

1. Open `http://<host>:5000/app/`.
2. Sign in. A fresh session is expected.
3. Confirm schemas and records are present.
4. Open a record with an uploaded image and confirm `/files/...` loads.
5. Run one AI prompt only after confirming the AI provider key survived (it is stored in the service SQLite database).
6. Confirm uploaded frontend apps still resolve at their configured paths.

---

## 7. Rollback

Keep the previous image tag and a copy of the volume archive until verification passes.

```bash
docker compose down
docker tag senthil455/cms-mono:previous senthil455/cms-mono:latest
docker compose up -d
```

For PostgreSQL, restore the pre-migration dump rather than attempting a partial rollback.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `volume not found` | Wrong Compose project prefix | List volumes and set `CMS_VOLUME` / `PG_VOLUME` |
| App starts but data is empty | Wrong volume, or config points at a different SQLite file | Inspect `/data` and `config/cms.settings.json` |
| `COPY CMS/... not found` during a source build | Build context does not contain a sibling `CMS/` checkout | Use the published image or fix the build context |
| `dotnet: CMS.MonoApp.dll not found` | `CMS/publish` was not produced | Publish the external CMS project before building |
| `psql: error: connection refused` | Database not ready | Wait for `pg_isready`, then retry |
| 502 on `/api` | .NET process crashed or is restarting | Check `docker compose logs app` |
| Login loop after migration | Cookies scoped to a different host | Use one hostname consistently; set `FRONTEND_URL` to the public origin |
| Uploads missing | `files/` not in the archived volume | Re-archive the full volume, not just the database |
| Uploads fail with 413 | Body exceeds `CMS_MAX_REQUEST_SIZE` | Raise it and restart |

---

## 9. Reference

- [`mono-deploy-local/docker-compose.yml`](../mono-deploy-local/docker-compose.yml) — local app + PostgreSQL
- [`mono-deploy-hub/docker-compose.prod.yml`](../mono-deploy-hub/docker-compose.prod.yml) — pull-based production Compose
- [`mono-deploy-local/build-fast.sh`](../mono-deploy-local/build-fast.sh) — local build script
- [`mono-deploy-local/entrypoint.sh`](../mono-deploy-local/entrypoint.sh) — startup sequence
- [Docker Deployment](./wiki/Docker-Deployment.md) — image layout, routes, and path assumptions
