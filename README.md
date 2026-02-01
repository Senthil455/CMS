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

Get the project running locally in 4 steps.

### 1. Clone Repositories
```bash
git clone git@github.com/Senthil455/CMS.git
git clone git@github.com/Senthil455/CMS.git
```

### 2. Start Backend (CMS)
```bash
cd cms/examples/SqliteDemo
dotnet run
```
_Verify that `http://127.0.0.1:5000` is accessible._

### 3. Configure Environment (CMS)
Open a new terminal and set up the AI agent with your Gemini API key.
```bash
npm i #install dependencies
cd packages/backend
cp .env.example .env
```
Edit `.env` and add your Gemini API key (get a free one [here](https://aistudio.google.com/app/apikey)):
```ini
GEMINI_API_KEY=your_key_here
```

Initialize the database and Prisma client:
```bash
npx prisma generate
npx prisma db push
```

**3. Configure Frontend**
```bash
cd ../frontend
cp .env.example .env
```
_(No edit needed for default local setup)_

### 4. Start Development Server
```bash
# From cms root
npm install
npm run dev
```
Visit **http://127.0.0.1:5173** to start building!

> **Note:** Use `127.0.0.1` instead of `localhost` to ensure cookies are shared correctly.

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
