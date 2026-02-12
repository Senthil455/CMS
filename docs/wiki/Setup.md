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

### 4. Start Development Server
```bash
# From cms root
npm run build:shared
npm run dev
```
Visit **http://127.0.0.1:5173** to start building!

> **Note:** Use `127.0.0.1` instead of `localhost` to ensure cookies are shared correctly.

### 💡 Try it out
Once running, try these prompts:
- "Design entities for a library management system"
- "Add sample data for the book entity"
- "Create a query to display all available books"


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

For production deployment using Docker, please refer to the [Docker Deployment Guide](Docker-Deployment.md).
