# CMS: The AI-Powered CMS

CMS is an open-source CMS that uses AI to generate your entire app — schemas, data, APIs, and UI — from natural language. Build production-ready applications in minutes, not weeks.

---

## ✨ Why CMS?

<table>
<tr>
<td align="center" width="33%">
<h3>🤖 AI-Powered</h3>
<p>Generate schemas, data, GraphQL queries, and full UI pages using natural language prompts. Let AI handle the tedious work while you focus on creativity.</p>
</td>
<td align="center" width="33%">
<h3>🎨 Zero Backend Required</h3>
<p>No .NET or backend experience needed. Run CMS with Docker, build your app with React and AI — that's it.</p>
</td>
<td align="center" width="33%">
<h3>🚀 Scalable & Performant</h3>
<p>P95 latency under 200ms, 2,400+ QPS throughput. Handle millions of posts with CDN caching and billions of user activities with horizontal sharding.</p>
</td>
</tr>
</table>

---

## 🎥 In Action

Watch CMS build a complete Library system (Entities, Data, Queries, and UI) from scratch in under 60 seconds (sped up 10x).

![CMS Demo](https://github.com/Senthil455/CMS/blob/main/artifacts/demo_video.webp?raw=true)

---

## 🎨 For Frontend Developers

**You don't need .NET or any backend experience to use CMS.** Just run the Docker image and start building your frontend with the tools you already know:

- Use **React + Vite** to build your app
- Use **AI (e.g., Antigravity, Cursor)** to generate schemas, queries, and pages
- CMS provides the backend, APIs, and admin panel — all running inside Docker

📖 **[See the Vite + React + Antigravity example →](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Vite-React-Antigravity-Example)**

### 🏗️ Built with CMS

| App | Description |
|-----|-------------|
| **[Zen Health Tracker](https://zen.example.com/)** | A full health tracking app built in hours using CMS + AI coding agent — zero manual coding. |

---

## 🧑‍💼 For Non-Developers

**No coding skills? No problem.** CMS lets you build dynamic, data-driven pages without writing a single line of code.

- Use the **built-in CMS Page** feature to create pages powered by your database
- Let **AI generate entire pages** for you — not just static HTML, but pages that read and display live data
- Manage your content, schemas, and pages all from the visual admin panel

> **💡 Just describe what you want** — AI handles the schema, the data, and the page. You get a fully functional, dynamic web page.

---

## 🚀 Quick Start (Docker)

The easiest way to get CMS running. **No backend setup, no .NET, no database installation required.**

> **🟢 Don't want to install?** Try the [live demo](https://example.com/app) instantly — login: `admin@example.com` / `Admin1!`

Pull and run from [Docker Hub](https://hub.docker.com/r/senthil455/cms-mono):

```bash
docker run -d \
  --name cms \
  -p 5000:5000 \
  -v cms_data:/data \
  -e DATABASE_PROVIDER=0 \
  -e "CONNECTION_STRING=Data Source=/data/cms.db" \
  senthil455/cms-mono:latest
```

Then open **http://localhost:5000/app** and follow the setup wizard.

> **📌 That's it!** Try these prompts: *"Design entities for a library system"* · *"Add sample data for books"* · *"Create a query to display all books"*

For production deployment with PostgreSQL, see the [Docker Hub page](https://hub.docker.com/r/senthil455/cms-mono). Want to contribute or run from source? See the [Development Setup Guide →](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Setup.md)

---

## 📚 Learn More

⚡ **Performance:** P95 < 200ms · 2,400+ QPS · SQLite, PostgreSQL, SQL Server, MySQL

📖 [Documentation Wiki](https://github.com/Senthil455/CMS/tree/main/docs/wiki) · [Architecture](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md) · [Performance & Scalability](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Performance-Scalability.md) · [Setup Guide](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Setup.md)

---

## 🗺️ Roadmap

CMS is actively evolving toward a vision of **no-code app building with AI**. Here's what's coming:

| Phase | Focus | Key Features |
|-------|-------|-------------|
| **Enhanced AI** | Smarter generation | Natural language → schema, AI-suggested relationships, auto-generated CRUD & queries |
| **Visual Builder** | No-code editing | Drag-and-drop page builder, visual schema editor, real-time preview, theme templates |
| **Marketplace** | Community ecosystem | Pre-built app templates, community components, one-click install |

> **The Vision:** Describe your app in plain English → AI generates the entire backend (entities, queries, pages) → deploy with one click. No code required.