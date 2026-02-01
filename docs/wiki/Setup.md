# Setup Guide

This guide covers how to set up cms for both development and production environments.

---

## Development Environment

### Prerequisites
- Node.js 20+
- .NET 9 SDK
- PostgreSQL or SQLite

### 1. Clone Repositories

```bash
git clone git@github.com/Senthil455/CMS.git
git clone git@github.com/Senthil455/CMS.git
```

### 2. Setup cms (Node.js)

```bash
cd cms

# Install dependencies
npm install

# Build shared package
npm run build:shared

# Setup backend
cd packages/backend
cp .env.example .env
# Edit .env with your configuration
npx prisma generate
npx prisma db push

# Run backend (dev mode)
npm run dev
```

> **Note:** Ensure `CMS_BASE_URL` in `.env` points to your CMS backend (default: `http://localhost:5000`).

### 3. Setup CMS (.NET)

```bash
cd cms/server/CMS.Course

# Run with hot reload
dotnet watch run
```

### 4. Setup Frontend

```bash
cd cms/packages/frontend
cp .env.example .env
npm run dev
```

> **Note:** The frontend requires both configurations to work:
> - **`.env`** - Defines API URLs (`VITE_API_URL`, `VITE_CMS_URL`) for runtime use
> - **`vite.config.ts`** - Configures proxy routes (`/api`, `/graphql`, `/files`) for dev server

### 5. Access the Application

Visit the AI Schema Builder:

| URL | Description |
|-----|-------------|
| `http://127.0.0.1:5173/app` | AI Schema Builder via Vite dev server |

**Default Credentials:**
- **Username:** `admin@example.com`
- **Password:** `Admin1!`

> **Note:** Use `127.0.0.1` instead of `localhost` to ensure cookies are shared correctly between services.

#### How the Proxy Works

**CMS Proxy (port 5000):**

In development, the CMS backend (port 5000) proxies requests to cms:

```
┌─────────────────────────────────────────────────────────┐
│                    Port 5000 (CMS)                  │
├─────────────────────────────────────────────────────────┤
│  /cmsapi     → Port 3001 (cms Backend - Node.js)  │
│  /app-static → Port 3001 (cms Static Assets)      │
│  /api         → CMS Backend APIs                    │
└─────────────────────────────────────────────────────────┘
```

**Vite Proxy (port 5173):**

The frontend Vite dev server also proxies API requests to CMS:

```
┌─────────────────────────────────────────────────────────┐
│                Port 5173 (Vite Dev Server)              │
├─────────────────────────────────────────────────────────┤
│  /api         → Port 5000 (CMS Backend)             │
│  /graphql     → Port 5000 (CMS GraphQL)             │
│  /files       → Port 5000 (CMS File Assets)         │
└─────────────────────────────────────────────────────────┘
```

This allows you to access everything through either port (5000 or 5173) while each service runs independently during development.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `GEMINI_API_KEY` | Google Gemini API key **(recommended, fully tested)** |
| `OPENAI_API_KEY` | OpenAI API key (experimental, not fully tested) |
| `CMS_API_URL` | CMS backend URL |

> **Note:** Currently, only **Gemini** has been fully tested. OpenAI support is experimental.

---

## Production Environment (Docker)

### Prerequisites
- Docker
- Docker Compose (optional)

### Build Docker Image

The Dockerfile builds a combined image with both cms (Node.js) and CMS (.NET).

A convenience script is provided to build and run the container:

```bash
# From cms root
./rebuild-docker.sh
```

Or manually:

```bash
# From parent directory containing both repos
docker build -t cms-integrated -f cms/Dockerfile .
```

### Run Container

```bash
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="your-database-url" \
  -e GEMINI_API_KEY="your-gemini-key" \
  -e OPENAI_API_KEY="your-openai-key" \
  cms-integrated
```

> **Note:** Inside the container, two services run on separate ports:
> - **Port 5000** - CMS Backend (.NET)
> - **Port 3001** - cms Backend (Node.js), also serves the frontend (built to `dist/`)
>
> Only port 5000 needs to be exposed because the CMS backend proxies all `/app`, `/cmsapi`, and `/app-static` requests to port 3001 internally.

### Docker Build Stages

| Stage | Description |
|-------|-------------|
| **builder** | Builds cms frontend & backend (Node.js 20) |
| **dotnet-builder** | Builds CMS (.NET 9) |
| **final** | Runtime with both Node.js and .NET |

### Exposed Routes

| Route | Service |
|-------|---------|
| `/api` | CMS Backend |
| `/app` | cms Frontend |
| `/cmsapi` | cms Backend |
| `/app-static` | cms Static Assets |
| `/admin` | Admin App |
| `/portal` | User Portal |
