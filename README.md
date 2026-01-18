# CMS: The AI-Powered CMS

CMS is a cutting-edge, open-source Content Management System designed to revolutionize web development through AI. By automating the most tedious parts of development—schema design, data seeding, API creation, and UI building—CMS allows you to build complex, production-ready applications in minutes rather than weeks.

---

## ⚡ Powering Your Workflow with AI

CMS isn't just a place to store content; it's an AI-driven development partner. 

### 1. Generate Entity (Schema)
Forget manual table definitions. Simply describe your business domain (e.g., "I need a system to manage a digital library with books, authors, and rentals"), and CMS's AI will:
- Design the normalized database schema.
- Establish relationships (Many-to-One, Many-to-Many).
- Configure appropriate data types (Strings, Numbers, Lookups, Junctions).

### 2. Generate Data (Seeding)
Tired of "Lorem Ipsum"? Use AI to generate realistic, high-quality sample data:
- Populate your database with meaningful records.
- Preserve relational integrity across entities.
- Test your UI with data that looks and feels real.

### 3. Generate Query (API)
Writing GraphQL can be complex. In CMS, you can:
- Prompt the AI to build logic: "Give me all books published after 2020 by authors with more than 5 stars."
- The AI generates the GraphQL query and converts it into a secure, high-performance REST endpoint automatically.

### 4. Generate Page (UI)
Go from prompt to page instantly:
- "Build a landing page for my library that sections books by genre and features a search bar."
- AI generates the HTML/CSS using semantic structures and bridges it with your data queries.

---

## 🎥 In Action

Watch CMS build a complete Library system (Entities, Data, Queries, and UI) from scratch in under 3 minutes.

[**▶️ Watch the Full Demo Video (with subtitles)**](./artifacts/demo_video.webp)

### Highlight Steps

#### 1. Generate Entity
**Prompt:** _"Create a Book entity with title, author, isbn, and publishedDate."_
![Entity Generation](./artifacts/1_book_entity.png)

#### 2. Generate Data
**Prompt:** _"Generate 5 books."_
![Data Seeding](./artifacts/2_book_data.png)

#### 3. Generate Query
**Prompt:** _"Create a query named 'getBooks' to list all books."_
![Query Generation](./artifacts/3_book_query.png)

#### 4. Generate Page
**Prompt:** _"Create a page 'Library' to list books using getBooks query."_
![Page Generation](./artifacts/4_book_page.png)

---

## 🏗️ Architecture

CMS is built on a modern, decoupled architecture designed for performance and flexibility.

```mermaid
graph TD
    A[cms] -->|AI-Generated Schema & UI| B[CMS Ecosystem]
    C[CMS Admin] -->|Management & Editing| D[cms Backend]
    E[Portal / Frontend] -->|Consumes APIs| D
```

### 1. **cms** (AI Schema & UI Builder)
The "brain" of the ecosystem. This tool leverages LLMs to architect your data models and design your UI. It translates your natural language requirements into technical configurations that the system understands.

### 2. **cms** (Backend Engine)
The core high-performance engine built with **ASP.NET Core (C#)**.
- **REST & GraphQL**: Automatically exposes APIs for every entity you define.
- **Normalized Storage**: Optimized for speed (Sqlite, Postgres, SQL Server, MySQL supported).
- **Scale**: Designed to handle millions of records and high-concurrency environments.

### 3. **CMS Admin** (Management Dashboard)
A sleek, **React-based** administrative interface.
- Manage your entities, queries, and pages.
- Visual editors for relationships and data.
- Built-in audit logging and publication workflows.

---

## 🚀 Getting Started

Visit our [Documentation](https://github.com/Senthil455/CMS/wiki) to get started.
