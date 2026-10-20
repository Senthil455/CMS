# Running CMS on a Zero-Cost Budget

This guide is about keeping a CMS deployment cheap, not about promising that hosting is permanently free. Free tiers change, and the image runs two application runtimes plus a gateway, so resource limits matter.

> **What "zero cost" can realistically mean:** a free-tier VM or container host, SQLite instead of managed PostgreSQL, a free AI tier, and no paid add-ons. Expect to hit CPU, RAM, disk, or egress limits at some point.

---

## 1. Know what you are running

The image contains:

| Component | Approximate role |
|---|---|
| Nginx | Gateway on port `5000` |
| Node.js + Fastify | Studio, admin, portal, Stash, `/cmsapi` |
| ASP.NET Core CMS | Entities, records, queries, pages, auth, assets |
| ffmpeg | Media conversion for Stash |

Practical minimum for a demo:

- **1 vCPU**
- **1 GB RAM** (2 GB is safer, especially during schema work and media conversion)
- **2–5 GB disk** for the image, SQLite databases, and uploads

A 512 MB container may start but is likely to struggle. If a free tier offers less than 1 GB, expect restarts or OOM kills.

---

## 2. Choose a hosting shape

### Option A — Free container host

Providers such as Koyeb, Render, and Fly.io have offered free or low-cost container tiers. Before choosing one, check:

- **Persistent storage:** many free tiers use ephemeral filesystems. Without a volume, every restart loses the SQLite database and uploads.
- **Always-on behavior:** free services may sleep after inactivity, which breaks long AI runs and Socket.IO sessions.
- **Memory limit:** the image needs roughly 1 GB to feel stable.
- **Public port:** the container listens on `5000`; map the provider's port to it.
- **Build vs pull:** deploy the published image `senthil455/cms-mono:latest` rather than building from source.

A free container tier is fine for a demo. It is a poor fit for anything you expect to keep.

### Option B — Free-tier VM (more control)

Oracle Cloud's Always Free tier is a common choice. It provides a real VM where you control Docker, volumes, and ports.

---

## 3. Oracle Cloud Always Free walkthrough

### 3.1 Network

1. Create a **Virtual Cloud Network (VCN)**.
2. Add an **ingress rule** for TCP `80` and `443` (and `22` for SSH).
3. Keep the default egress rule.

### 3.2 Instance

1. Create a **Compute Instance**.
2. Prefer the **Ampere A1** always-free shape (up to 4 OCPUs / 24 GB RAM, subject to capacity).
3. Choose **Ubuntu** or **Rocky Linux**.
4. Save the SSH key.

### 3.3 Install Docker

Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Rocky Linux:

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Sign out and back in for the group change to apply.

### 3.4 Open the host firewall

Ubuntu:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Rocky Linux:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

Oracle images may also have iptables rules that block ports. If the service is unreachable, check:

```bash
sudo iptables -L -n
```

Add the required ACCEPT rules or use the distribution's firewall tooling.

Do not disable SELinux globally just to make a container run. If SELinux blocks a bind mount, label the directory or use a named volume.

### 3.5 Run CMS with SQLite

Create `docker-compose.yml`:

```yaml
services:
  app:
    image: senthil455/cms-mono:latest
    ports:
      - "80:5000"
    environment:
      - DATABASE_PROVIDER=0
      - "CONNECTION_STRING=Data Source=/data/cms.db"
      - CMS_DATA_PATH=/data
      - "DATABASE_URL=file:/data/app/sqlite.db"
      - FRONTEND_URL=http://YOUR_SERVER_IP
    volumes:
      - cms_data:/data
    restart: unless-stopped

volumes:
  cms_data:
```

```bash
docker compose up -d
docker compose logs -f app
```

Open `http://YOUR_SERVER_IP/app/`.

Set `FRONTEND_URL` to the exact origin users will visit. Cookies are host-scoped; mixing an IP and a domain causes login loops.

### 3.6 Add a domain and TLS (optional, may cost money)

A domain usually costs money. TLS certificates from Let's Encrypt are free.

If you put a host Nginx or Caddy in front of the container:

- bind CMS to `127.0.0.1:5000` instead of `0.0.0.0:80`;
- proxy `/` to `127.0.0.1:5000`;
- enable WebSocket upgrade headers for `/cmsapi/socket.io`;
- set `FRONTEND_URL=https://your-domain.example`.

Caddy handles certificates automatically. Host Nginx requires Certbot or manual certificate management.

---

## 4. Keep the database free

SQLite is the cheapest option:

- no separate database service;
- no network latency;
- one volume to back up.

Use it when:

- one CMS instance is running;
- write concurrency is modest;
- you can tolerate brief downtime for backups.

Use PostgreSQL when you need concurrent writers, managed backups, or multiple app instances. Managed PostgreSQL is rarely free for long. A free-tier PostgreSQL often has storage and connection limits, and may expire.

If you do use PostgreSQL, run it in the same Compose stack and back it up with `pg_dump`:

```bash
docker compose exec -T db pg_dump -U postgres cms > cms.sql
```

Do not copy the PostgreSQL data directory as a backup.

---

## 5. Keep AI costs down

### Gemini

Google AI Studio offers a free tier for Gemini models. Limits and eligible models change; check the current quota before relying on it.

1. Create a key at [Google AI Studio](https://aistudio.google.com/).
2. In CMS, open **Settings → AI Providers**.
3. Paste the key and select a Gemini model.

### OpenAI

OpenAI is paid. Use it only when you specifically need those models, and watch usage in the provider dashboard.

### Practical limits

- AI keys are stored in the service SQLite database as **plaintext**. Protect the volume and restrict Studio access.
- Long agent runs consume tokens even if the resulting schema is discarded.
- There is no built-in token or cost budget in the current service. Monitor the provider dashboard.
- Free tiers may use your prompts for product improvement. Do not paste sensitive data.

---

## 6. Backups on a budget

A volume snapshot is not a backup if it lives on the same host. Keep one copy elsewhere.

```bash
# Archive the CMS volume
docker run --rm \
  -v cms_data:/volume \
  -v "$PWD":/backup \
  alpine tar czf /backup/cms_data.tar.gz -C /volume .

# Copy it off the host
scp cms_data.tar.gz user@backup-host:/backups/
```

Run this on a schedule with `cron` or a systemd timer. Test a restore before you need it.

Free object storage tiers exist, but egress and request limits apply. A small backup archive is usually cheap; a media-heavy `files/` directory may not be.

---

## 7. Cost traps

| Trap | Why it bites |
|---|---|
| Ephemeral container filesystem | Data disappears on redeploy |
| Free database that expires | Surprise migration under pressure |
| Managed PostgreSQL minimums | Storage, backups, and connections add up |
| Media uploads | Disk and egress grow with every file |
| Always-on requirement | Free tiers may sleep or throttle |
| Custom domain | Registration and renewal fees |
| Email delivery | Transactional email is usually paid at volume |
| Multiple environments | Each replica needs its own volume and resources |

---

## 8. Minimal checklist

- [ ] Use `senthil455/cms-mono:latest`, not a source build.
- [ ] Start with SQLite and one volume.
- [ ] Give the container at least 1 GB RAM.
- [ ] Set `FRONTEND_URL` to the exact public origin.
- [ ] Set `SESSION_SECRET`.
- [ ] Add a free Gemini key only if you need AI features.
- [ ] Schedule volume backups to another host.
- [ ] Test the restore path.
- [ ] Check the provider's current free-tier limits before launch.
- [ ] Move to PostgreSQL and a paid tier before real traffic.

---

## 9. Related documentation

- [Docker Deployment](../docs/wiki/Docker-Deployment.md)
- [Migration Guide](../docs/migration-guide.md)
- [Setup](../docs/wiki/Setup.md)
- [Docker Hub listing](./DOCKERHUB.md)
