# Setup Guide

This guide covers how to set up cms for both development and production environments.

---

## Development Environment

### Prerequisites
- Node.js 20+
- .NET 10 SDK
- PostgreSQL or SQLite

### 1. Clone Repositories
```bash
git clone https://github.com/Senthil455/CMS.git
git clone https://github.com/Senthil455/CMS.git
```

### 2. Start Backend (CMS)
```bash
cd cms/server/CMS.MonoApp
dotnet run
```
_Verify that `http://127.0.0.1:5000` is accessible._

### 3. Start Development Server
```bash
# From cms root
npm run setup
npm run dev
```
Visit **http://127.0.0.1:5173** to start building!

> **Note:** Use `127.0.0.1` instead of `localhost` to ensure cookies are shared correctly.
> **Note:** During setup, cms backend needs to be manually restarted to load new configuration.

### 💡 Try it out
Once running, try these prompts:
- "Design entities for a library management system"
- "Add sample data for the book entity"
- "Create a query to display all available books"


> **Note:** Currently, only **Gemini** has been fully tested. OpenAI support is experimental.

---
