# CMS Mono-Deploy Build Guide

This directory contains scripts and configurations for building and deploying the CMS mono-repo application (CMS .NET + CMS Node.js) as a single Docker container.

## Quick Start

```bash
# Fast build (recommended for development)
./build-fast.sh
./reload.sh

# Access the application
open http://localhost:5000
```

## Build Methods

### 1. Fast Build (Recommended for Development)

**Script:** `build-fast.sh`  
**Dockerfile:** `Dockerfile.fast`

Builds the application locally first, then copies pre-built artifacts into Docker. This is **significantly faster** because:
- Leverages local build cache
- Doesn't rebuild unchanged code
- Skips dependency installation in Docker

**Usage:**
```bash
./build-fast.sh
```

**What it does:**
1. Builds CMS (Frontend + Backend) locally using `npm`
2. Publishes CMS (.NET) locally using `dotnet publish`
3. Creates Docker image with pre-built artifacts
4. Tags as `cms-mono-deploy:latest`

**Requirements:**
- Node.js 24+ installed locally
- .NET 10 SDK installed locally
- npm dependencies installed

**Build time:** ~30-60 seconds (after first build)

---

### 2. Production Build (Multi-Architecture)

**Script:** `build.sh`  
**Dockerfile:** `Dockerfile`

Builds everything inside Docker using multi-stage builds. Supports **cross-platform builds** for different architectures (amd64, arm64).

**Usage:**

**Single architecture (current platform):**
```bash
./build.sh
```

**Multi-architecture (amd64 + arm64):**
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t cms-mono-deploy:latest \
  -f Dockerfile \
  --push \
  ../..
```

**What it does:**
1. Stage 1: Builds CMS (Node.js) inside Docker
2. Stage 2: Builds CMS (.NET) inside Docker
3. Stage 3: Creates final runtime image with both applications
4. Supports multi-architecture builds via Docker Buildx

**Requirements:**
- Docker with Buildx support
- No local dependencies needed

**Build time:** ~5-10 minutes (first build)

---

## Configuration

### Environment Variables

Configure the application via `docker-compose.yml`:

```yaml
environment:
  # Database Configuration
  - DATABASE_PROVIDER=1  # 0=SQLite, 1=Postgres, 2=SqlServer, 3=MySQL
  - CONNECTION_STRING=Host=db;Port=5432;Database=cms;Username=postgres;Password=postgres;
  - CMS_CONFIG_PATH=/config/cms.settings.json

  # Node.js Configuration
  - PORT=3001
  - CMS_BASE_URL=http://localhost:5000
  - DATABASE_URL=file:/app/packages/backend/data/sqlite.db

volumes:
  - cms_config:/config
```

### Database Providers

**PostgreSQL (default):**
```yaml
- DATABASE_PROVIDER=1
- CONNECTION_STRING=Host=db;Port=5432;Database=cms;Username=postgres;Password=postgres;
```

**MySQL:**
```yaml
- DATABASE_PROVIDER=3
- CONNECTION_STRING=Server=db;Port=3306;Database=cms;User=root;Password=mysql;
```

**SQLite:**
```yaml
- DATABASE_PROVIDER=0
- CONNECTION_STRING=Data Source=/app/data/cms.db
```

---

## Deployment

### Local Development

```bash
# Build and start
./build-fast.sh
docker-compose up -d

# View logs
docker-compose logs -f

# Reload after changes
./reload.sh
```

### Production Deployment

**1. Build multi-architecture image:**
```bash
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-registry/cms-mono-deploy:latest \
  -f Dockerfile \
  --push \
  ../..
```

**2. Deploy to server:**
```bash
# Pull image
docker pull your-registry/cms-mono-deploy:latest

# Run with docker-compose
docker-compose up -d
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Nginx (Port 5000)               │
│  ┌───────────────────────────────────┐  │
│  │  /          → CMS (.NET:5001) │  │
│  │  /app/     → CMS (Node:3001)│  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   ┌──────────┐        ┌──────────┐
   │ CMS  │        │ CMS │
   │ (.NET 10)│        │ (Node 24)│
   └──────────┘        └──────────┘
         │                    │
         └────────┬───────────┘
                  ▼
          ┌──────────────┐
          │  PostgreSQL  │
          │  (Port 5432) │
          └──────────────┘
```

---

## Files

| File | Purpose |
|------|---------|
| `build-fast.sh` | Fast build script (local build + Docker) |
| `build.sh` | Production build script (all in Docker) |
| `Dockerfile.fast` | Fast build Dockerfile |
| `Dockerfile` | Production multi-stage Dockerfile |
| `docker-compose.yml` | Container orchestration |
| `entrypoint.sh` | Container startup script |
| `nginx.conf` | Nginx reverse proxy configuration |
| `reload.sh` | Reload container with latest image |

---

## Troubleshooting

### Build fails with "dist not found"

**Issue:** `.dockerignore` is excluding dist directories

**Fix:** Ensure `.dockerignore` allows dist directories:
```bash
# Comment out these lines in ../../.dockerignore
# **/dist
# cms/packages/*/dist
```

### .NET version mismatch

**Issue:** Container has .NET 8.0 but app needs 10.0

**Fix:** Update base image in Dockerfile:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0
```

### Database connection fails

**Issue:** App tries to connect to localhost instead of Docker service

**Fix:** Verify `CONNECTION_STRING` uses service name:
```yaml
CONNECTION_STRING=Host=db;Port=5432;...  # Use 'db', not 'localhost'
```

---

## First-Time Setup

1. **Start the application:**
   ```bash
   ./build-fast.sh
   docker-compose up -d
   ```

2. **Access system settings:**
   - Navigate to `http://localhost:5000/app/settings`
   - The system will automatically check database connectivity.

3. **Create first admin:**
   - Since the database is pre-configured via environment variables, you will be redirected to create the Super Admin.
   - Enter your email and password.
   - Click "Create Admin".
   - Log in and start using CMS.

4. **Reconfiguration (if needed):**
   - If you need to change the database connection later:
     - Delete the persistent config file: `docker exec -it <container> rm /config/cms.settings.json`
     - Restart the container.
     - The app will re-enter setup mode (or regenerate config from env vars).

---

## Performance Comparison

| Build Method | First Build | Incremental Build | Multi-Arch Support |
|--------------|-------------|-------------------|-------------------|
| Fast Build   | ~2-3 min    | ~30-60 sec       | ❌ No             |
| Production   | ~5-10 min   | ~3-5 min         | ✅ Yes            |

**Recommendation:**
- **Development:** Use `build-fast.sh` for rapid iteration
- **Production:** Use `build.sh` with Buildx for deployment
