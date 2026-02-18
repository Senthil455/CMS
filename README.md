# CMS: The AI-Powered CMS

CMS is a cutting-edge, open-source Content Management System designed to revolutionize web development through AI. By automating the most tedious parts of development—schema design, data seeding, API creation, and UI building—CMS allows you to build complex, production-ready applications in minutes rather than weeks.

---

## ✨ Why CMS?

<table>
<tr>
<td align="center" width="33%">
<h3>🤖 AI-Powered</h3>
<p>Generate schemas, data, GraphQL queries, and full UI pages using natural language prompts. Let AI handle the tedious work while you focus on creativity.</p>
</td>
<td align="center" width="33%">
<h3>💬 Built-in Engagement</h3>
<p>Add engagement bars (views, likes, bookmarks, shares) and user avatars to any page with AI prompts. Social features are first-class citizens, not afterthoughts.</p>
</td>
<td align="center" width="33%">
<h3>🚀 Scalable & Performant</h3>
<p>P95 latency under 200ms, 2,400+ QPS throughput. Handle millions of posts with CDN caching and billions of user activities with horizontal sharding.</p>
</td>
</tr>
</table>

---

## ⚡ What You Can Do with AI

CMS acts as your AI-driven development partner. Describe what you want, and it builds it:

- **Generate the Full Stack**: Entities (schemas), Seed Data, GraphQL Queries, and UI Pages from natural language.
- **Add Engagement Instantly**: "Add a like button" or "Show user avatar" simply works.
- **Manage & Iterate**: View version history and manage artifacts in the visual portal.

📖 **[See Wiki for full capabilities →](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Building-a-System.md)**

---

## 🎥 In Action

Watch CMS build a complete Library system (Entities, Data, Queries, and UI) from scratch in under 60 seconds (sped up 10x).

![CMS Demo](https://github.com/Senthil455/CMS/blob/main/artifacts/demo_video.webp?raw=true)

---

## 🟢 Live Demo

Try the live demo at [example.com/app](https://example.com/app).

**Credentials:**
- **Username:** `admin@example.com`
- **Password:** `Admin1!`

---

## 🚀 Quick Start

Get the project running locally in 5 steps.

### 1. Clone Repositories
```bash
git clone git@github.com/Senthil455/CMS.git
git clone git@github.com/Senthil455/CMS.git
```

### 2. Start Backend (CMS)
```bash
cd cms/server/CMS.MonoApp
dotnet run
```
_Verify that `http://127.0.0.1:5000` is accessible._

### 3. Start CMS Service
Open a new terminal:
```bash
cd cms
npm i
npm run build:all
npm run dev:service
```

### 4. Initial Setup
Visit **http://localhost:3001/app** — before the system is ready, you'll be guided through a setup page:

1. **Setup Database Connection** — choose your database provider and configure the connection string.
2. **Create Super Admin** — add an initial super admin user account.
3. **Restart Backend** — after completing steps 1 and 2, the backend will quit. Follow [Step 2](#2-start-backend-cms) to restart it. _(In a Docker deployment, the container will auto-restart.)_
4. **Setup Gemini API Key** — configure your Gemini API key for AI features.

Once setup is complete, visit **http://localhost:3001/app** to start building!


### 💡 Try it out
Once running, try these prompts:
- "Design entities for a library management system"
- "Add sample data for the book entity"
- "Create a query to display all available books"

📖 **[See Wiki for detailed setup instructions →](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Setup.md)**

---

## 📚 Documentation

For detailed documentation, please refer to our **[Wiki](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Home.md)** (source of truth):

| Documentation | Description |
|---------------|-------------|
| [Setup Guide](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Setup.md) | Development and production environment setup |
| [Architecture](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md) | Component architecture and system design |
| [Orchestrator Strategy](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Orchestrator-Strategy.md) | Multi-agent pipeline design and debugging approach |
| [Performance & Scalability](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Performance-Scalability.md) | Benchmarks and scaling strategies |

---

## 🏗️ Architecture Overview



| Component | Description |
|-----------|-------------|
| **cms** | AI-powered schema & UI builder |
| **cms** | High-performance CMS backend (ASP.NET Core) |
| **AdminApp** | React admin panel for content management |
| **Portal** | User portal for history, likes, and bookmarks |

📖 **[See Wiki for detailed architecture →](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md)**

---

## ⚡ Performance

| Metric | Performance |
|--------|-------------|
| **P95 Latency** | < 200ms |
| **Throughput** | 2,400+ QPS per node |
| **Complex Queries** | 5-table joins over 1M rows |
| **Database Support** | SQLite, PostgreSQL, SQL Server, MySQL |

📖 **[See Wiki for performance details →](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Performance-Scalability.md)**
