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

CMS isn't just a place to store content; it's an AI-driven development partner. 

### 1. Generate Entity (Schema)
Describe your business domain and AI will design normalized database schemas with relationships and appropriate data types.

### 2. Generate Data (Seeding)
Use AI to generate realistic, high-quality sample data that preserves relational integrity.

### 3. Generate Query (API)
Prompt the AI: "Give me all books published after 2020 by authors with more than 5 stars." It generates the GraphQL query and converts it into a REST endpoint automatically.

### 4. Generate Page (UI)
Go from prompt to page: "Build a landing page for my library that sections books by genre." AI generates the HTML/CSS and bridges it with your data queries.

### 5. Add Engagement Bar
Prompt: "Add likes, bookmarks, shares, and view count to my article page." AI integrates interactive social engagement features automatically.

### 6. Add User Avatar
Prompt: "Show the author's avatar and profile link." AI adds user identity components to your pages.

### 7. View History in Portal
Access all your generated schemas, queries, and pages in the portal. Compare versions and rollback changes anytime.

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
```bash
cd cms/packages/backend
cp .env.example .env
```
Edit `.env` and add your Gemini API key (get a free one [here](https://aistudio.google.com/app/apikey)):
```ini
GEMINI_API_KEY=your_key_here
```

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

```mermaid
graph TD
    U1[👨‍💻 Developer] -->|Build Schema & UI| A[cms /app]
    U2[👔 Admin] -->|Manage Content| C[AdminApp /admin]
    U3[👤 End User] -->|View & Engage| D[Portal /portal]
    
    A --> B[CMS Backend /api]
    A --> E[AI - Gemini / OpenAI]
    C --> B
    D --> B
```

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
