# CMS Page Editor Architecture (AI + SSR + Tailwind)

## 🎯 Goal

Build a modern page editor that:

* Uses AI to generate page layout
* Allows drag-and-drop layout editing (React-based)
* Outputs clean HTML with Tailwind CSS
* Supports full SSR using Handlebars
* Allows users to re-edit layout later

Avoid:

* Free HTML editing
* Inline styles
* DOM-as-source-of-truth
* GrapesJS-style grid wrappers

---

# 🏗 Core Architecture

## 1️⃣ Source of Truth = Layout JSON

The layout structure is stored as structured JSON, not HTML.

Example:

```json
{
  "sections": [
    {
      "preset": "8-4",
      "columns": [
        {
          "span": 8,
          "blocks": [
            { "type": "featured-post", "props": { "source": "posts" } }
          ]
        },
        {
          "span": 4,
          "blocks": [
            { "type": "post-list", "props": { "limit": 5 } }
          ]
        }
      ]
    }
  ]
}
```

This supports:

* Complex editorial layouts (NYT-style)
* Multi-column grids
* Nested structure
* Tailwind 12-column system

---

# 🧱 Layout Model

Hierarchy:

```
Page
 ├── Section
 │     ├── Columns
 │     │     ├── Blocks
```

* Page = entire document
* Section = layout preset (8/4, 3-column, hero, etc.)
* Column = Tailwind grid span
* Block = content component

---

# 🧩 Block System

Each block maps to a Handlebars partial.

Example block partial:

```handlebars
<section class="py-20 text-center bg-gray-100">
  <h1 class="text-4xl font-bold">{{title}}</h1>
</section>
```

Blocks:

* hero
* featured-post
* post-list
* cta
* faq

No inline styles.
Pure Tailwind.

---

# 🖥 Editor (Frontend)

Technology:

* React
* dnd-kit (for drag and drop)

Editor Layout:

Left Panel:

* Section tree
* Columns
* Blocks
* Drag to reorder / move

Right Panel:

* Live SSR preview
* Renders actual backend HTML

Important:

* No HTML editing
* No WYSIWYG canvas
* Drag modifies JSON only

---

# 🤖 AI Integration

AI generates structured layout JSON only.

Example AI output:

```json
{
  "sections": [
    {
      "preset": "8-4",
      "columns": [
        {
          "span": 8,
          "blocks": [
            { "type": "featured-post" }
          ]
        },
        {
          "span": 4,
          "blocks": [
            { "type": "post-list", "props": { "limit": 5 } }
          ]
        }
      ]
    }
  ]
}
```

AI never:

* Generates raw HTML
* Writes Tailwind classes
* Controls grid

Layout presets and rendering remain controlled by system.

---

# 💾 Save Strategy

Store two parts:

```
layoutJson (source of truth)
compiledHtml (generated snapshot)
```

When saving:

1. User edits layoutJson
2. System compiles layoutJson → Handlebars HTML
3. Store compiledHtml

Important rule:

layoutJson = canonical
compiledHtml = derived

Never allow manual editing of compiledHtml.

---

# 🖨 Backend SSR Flow

1. Load compiledHtml
2. Inject data
3. Render via Handlebars
4. Return final HTML

OR (advanced option):

1. Load layoutJson
2. Compile layout → HTML at request time
3. Render via Handlebars

This guarantees zero drift.

---

# 🎨 Layout Presets (Controlled Grid)

Instead of arbitrary grids, define presets:

* 12-column full width
* 8/4 split
* 4/4/4
* Hero + sidebar
* Magazine layout

This prevents layout chaos.

---

# 🚀 Final Stack

Frontend (Editor):

* React
* dnd-kit
* State manager (Zustand / Redux)

Backend:

* ASP.NET Core
* Handlebars.NET
* Tailwind CSS

Database:

* layoutJson (JSON)
* compiledHtml (string)
* version

---

# 🧠 Key Principles

1. JSON is source of truth
2. HTML is generated
3. No free HTML editing
4. Layout presets control structure
5. AI outputs structured layout only
6. SSR-first architecture
7. Tailwind-only styling

---

# 🏛 Outcome

This system provides:

* AI-assisted page creation
* Complex editorial layouts
* Clean Tailwind output
* Full SSR compatibility
* Re-editable layout
* CMS-grade architecture

This is not a website builder.

This is a structured publishing engine for CMS.

---

# 💬 ChatGPT System Prompt

To generate the layouts via AI, use this system prompt:

```text
You are an expert layout designer system. Your task is to output a structured JSON layout based on the user's request. 

The JSON MUST conform to the following rules:
1. The root object MUST have a `sections` array.
2. Each section MUST have a `preset` (e.g., "12", "8-4", "4-4-4", "6-6") and a `columns` array.
3. Each column MUST have a `span` (mapping to Tailwind's 12-column grid, e.g., 4, 6, 8, 12) and a `blocks` array.
4. Each block MUST have a `type` string corresponding to a predefined component (e.g., "hero", "featured-post", "post-list", "cta", "faq") and an optional `props` object containing its data.

Do not write HTML, CSS, or Tailwind classes directly.
Do not output any markdown formatting, only pure, raw JSON.

Example Valid JSON:
{
  "sections": [
    {
      "preset": "8-4",
      "columns": [
        {
          "span": 8,
          "blocks": [
            { "type": "featured-post", "props": { "source": "posts" } }
          ]
        },
        {
          "span": 4,
          "blocks": [
            { "type": "post-list", "props": { "limit": 5 } }
          ]
        }
      ]
    }
  ]
}
```
