# CMS Deployment Guide

This guide covers different deployment options for CMS and how to choose the right platform for your needs.

## ❌ Vercel - Not Suitable for CMS

**Important:** Vercel doesn't support Docker deployments directly. Vercel is designed for:
- Serverless functions (Node.js, Python, Go)
- Static sites and frontend frameworks

**CMS requires:**
- Persistent .NET runtime
- Long-running processes
- Database connections
- Docker container support

## ✅ Recommended Deployment Platforms

### 1. Railway (Easiest - Recommended)

**Why Railway:**
- ✅ Native Docker support
- ✅ Free $5/month credit
- ✅ One-command deployment
- ✅ Built-in PostgreSQL
- ✅ Automatic HTTPS
- ✅ GitHub integration

**Quick Deploy:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Navigate to mono-deploy
cd cms/mono-deploy

# Initialize project
railway init

# Add PostgreSQL database
railway add

# Deploy
railway up
```

**Via GitHub:**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Railway auto-detects Dockerfile
6. Add PostgreSQL service
7. Click "Deploy"

**Environment Variables:**
```bash
DATABASE_PROVIDER=1
CONNECTION_STRING=Host=postgres.railway.internal;Port=5432;Database=railway;Username=postgres;Password=${{POSTGRES_PASSWORD}}
```

---

### 2. Render

**Why Render:**
- ✅ Docker support
- ✅ Free tier available
- ✅ Automatic SSL
- ✅ Managed databases

**Deploy Steps:**
1. Connect GitHub repository
2. Create new "Web Service"
3. Select "Docker" as environment
4. Point to `cms/mono-deploy/Dockerfile`
5. Add PostgreSQL database
6. Set environment variables
7. Deploy

---

### 3. Fly.io (Docker-First Platform)

**Why Fly.io:**
- ✅ Docker-native platform
- ✅ Global deployment
- ✅ Free tier (3 shared VMs)
- ✅ Built-in PostgreSQL

**Quick Deploy:**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Navigate to mono-deploy
cd cms/mono-deploy

# Launch app (creates fly.toml)
fly launch

# Deploy
fly deploy
```

**Create PostgreSQL:**
```bash
fly postgres create
fly postgres attach <postgres-app-name>
```

---

### 4. DigitalOcean App Platform

**Why DigitalOcean:**
- ✅ Docker support
- ✅ Predictable pricing
- ✅ Managed databases
- ✅ Auto-deploy on git push

**Deploy Steps:**
1. Create new App
2. Connect GitHub repository
3. Select "Dockerfile" build method
4. Add managed PostgreSQL database
5. Configure environment variables
6. Deploy

---

### 5. AWS/GCP/Azure (Enterprise)

**For Production/Enterprise:**

**AWS:**
- ECS/Fargate for containers
- RDS for PostgreSQL
- CloudFront for CDN

**Google Cloud:**
- Cloud Run for containers
- Cloud SQL for PostgreSQL
- Cloud CDN

**Azure:**
- Container Instances
- Azure Database for PostgreSQL
- Azure CDN

---

## Hybrid Deployment: Frontend on Vercel

If you want to use Vercel for the **frontend only**, deploy the React app to Vercel and CMS backend elsewhere:

```
┌─────────────────┐
│  Vercel         │
│  (React App)    │ ──API calls──> ┌──────────────────┐
└─────────────────┘                 │  Railway/Render  │
                                    │  (CMS API)   │
                                    └──────────────────┘
```

### Setup:

**1. Deploy CMS Backend to Railway:**
```bash
cd cms/mono-deploy
railway up
# Note the URL: https://cms-production.up.railway.app
```

**2. Deploy React Frontend to Vercel:**
```bash
cd your-react-app
vercel
```

**3. Set Environment Variable in Vercel:**
```bash
# In Vercel dashboard or CLI
VITE_API_URL=https://cms-production.up.railway.app
```

---

## Platform Comparison

| Platform | Docker Support | Free Tier | Database | Difficulty | Best For |
|----------|---------------|-----------|----------|------------|----------|
| **Railway** | ✅ Yes | $5/month credit | Built-in PostgreSQL | ⭐ Easy | Quick deployment |
| **Render** | ✅ Yes | 750 hours/month | Managed databases | ⭐⭐ Easy | Production apps |
| **Fly.io** | ✅ Yes | 3 shared VMs | Built-in PostgreSQL | ⭐⭐ Medium | Global deployment |
| **DigitalOcean** | ✅ Yes | No | Managed databases | ⭐⭐ Medium | Predictable costs |
| **AWS/GCP/Azure** | ✅ Yes | Limited | Managed databases | ⭐⭐⭐ Hard | Enterprise scale |
| **Vercel** | ❌ No | Yes | No | N/A | Frontend only |

---

## Configuration for Different Platforms

### Railway

```yaml
# railway.json (optional)
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "cms/mono-deploy/Dockerfile.fast"
  },
  "deploy": {
    "startCommand": "/app/entrypoint.sh",
    "healthcheckPath": "/api/system/is-ready"
  }
}
```

### Fly.io

```toml
# fly.toml
app = "cms"

[build]
  dockerfile = "cms/mono-deploy/Dockerfile.fast"

[env]
  DATABASE_PROVIDER = "1"
  PORT = "5000"

[[services]]
  http_checks = []
  internal_port = 5000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### Render

```yaml
# render.yaml
services:
  - type: web
    name: cms
    env: docker
    dockerfilePath: cms/mono-deploy/Dockerfile.fast
    envVars:
      - key: DATABASE_PROVIDER
        value: 1
      - key: CONNECTION_STRING
        fromDatabase:
          name: cms-db
          property: connectionString
    
databases:
  - name: cms-db
    databaseName: cms
    user: cms
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** App can't connect to database

**Solution:** Ensure `CONNECTION_STRING` uses the correct host:
```bash
# Railway
Host=postgres.railway.internal

# Render
Host=<database-hostname-from-render>

# Fly.io
Host=<postgres-app-name>.internal
```

### Build Timeouts

**Problem:** Docker build times out

**Solution:** Use `Dockerfile.fast` instead of `Dockerfile`:
```bash
# In platform settings, change dockerfile path
cms/mono-deploy/Dockerfile.fast
```

### Port Configuration

**Problem:** App not accessible

**Solution:** Ensure container exposes port 5000:
```dockerfile
EXPOSE 5000
```

And platform is configured to route to port 5000.

---

## Next Steps

After deployment:

1. **Access System Settings:**
   - Navigate to `https://your-app.railway.app/app/system-settings`

2. **Set Master Password:**
   - Database is pre-configured from environment variables
   - Set a master password for future configuration changes

3. **Create First Admin:**
   - Navigate to "Super Admin" tab
   - Create your first admin account

4. **Start Building:**
   - Use AI to generate entities
   - Build your React frontend
   - Deploy frontend to Vercel (optional)

---

## Cost Estimates

| Platform | Free Tier | Paid Tier | Database |
|----------|-----------|-----------|----------|
| Railway | $5 credit/month | ~$10-20/month | Included |
| Render | 750 hours/month | $7/month + database | $7/month |
| Fly.io | 3 shared VMs | ~$5-15/month | Included |
| DigitalOcean | No | $12/month + database | $15/month |

**Recommendation:** Start with Railway's free tier, upgrade as needed.
