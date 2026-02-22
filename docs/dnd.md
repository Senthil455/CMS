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

## 1️⃣ Source of Truth = Layout JSON + Components Map

The layout structure is stored as structured JSON, separated from the actual component HTML strings. Blocks are placed in the layout grid using an `id`, which references the actual HTML component map.

Example `layoutJson`:

```json
{
  "sections": [
    {
      "preset": "8-4",
      "columns": [
        {
           "span": 8,
           "blocks": [
             { "id": "block-1", "type": "featured-post" }
           ]
        },
        {
           "span": 4,
           "blocks": [
             { "id": "block-2", "type": "post-list" }
           ]
        }
      ]
    }
  ]
}
```

This strict separation ensures:
* Complex editorial layouts (NYT-style) with Tailwind 12-column systems.
* The frontend Drag-and-Drop editor ONLY manipulates the grid structure and Block `id` references, without ever touching HTML parsing.

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

# 🤖 AI Integration (Architect vs Builder)

AI page generation is split into two distinct steps to preserve separation of concerns. The AI fetches predefined Handlebars template chunks from `resources/html-blocks/` as inputs to understand what components are available.

### Step 1: Page Architect (Structure & Intent)
The Architect designs the grid structure (`layoutJson`) and outputs `componentInstructions` dictating *what* each block should do.

Example Architect Output:
```json
{
  "layoutJson": {
    "sections": [
      {
        "preset": "8-4",
        "columns": [
          { "span": 8, "blocks": [{ "id": "block-1", "type": "featured-post" }] },
          { "span": 4, "blocks": [{ "id": "block-2", "type": "post-list" }] }
        ]
      }
    ]
  },
  "componentInstructions": [
    { "id": "block-1", "instruction": "Show the main featured NYT article with a large image.", "queriesToUse": ["getFeaturedNews"] },
    { "id": "block-2", "instruction": "Show the latest 5 posts in a sidebar.", "queriesToUse": ["getLatestPosts"] }
  ]
}
```

### Step 2: Page Builder (Execution)
The Builder reads the instructions and the `html-blocks/` templates. It executes the instructions by outputting a map of finalized Component HTML for each `id`.

Example Builder Output:
```json
{
  "components": {
    "block-1": { "html": "<div class='featured-post'>{{#each getFeaturedNews}}...{{/each}}</div>" },
    "block-2": { "html": "<div class='sidebar-list'>{{#each getLatestPosts}}...{{/each}}</div>" }
  }
}
```

The AI never writes Tailwind layout grid wrappers (`<div class="col-span-8">`). Layout presets and structural rendering remain controlled by the system's `LayoutCompiler` inside `@cms/shared`.

---

# 💾 Save Strategy & Compiler

Store three parts:

```
layoutJson (grid source of truth)
components (map of HTML component partials)
html (fully compiled snapshot)
```

When saving:

1. User edits layout via Drag and Drop (mutates `layoutJson`).
2. Customizes a specific component (mutates `components[id].html`).
3. System (`@cms/shared/src/utils/layout-compiler.ts`) stitches `layoutJson` grids + `components` map → `html`.
4. Store the compiled `html` on the server so `.NET` SSR functions blindly.

Important rules:

* layoutJson + components = canonical
* html = derived

Never allow manual editing of the fully compiled `html`.

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

Database (e.g. `Server/Core/Descriptors/Page.cs`):

* layoutJson (JSON string)
* components (JSON string)
* html (string)
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

To generate the layouts via AI Page Architect, use this system prompt:

```text
You are an expert layout designer system. Your task is to output a structured JSON layout based on the user's request. 

The JSON MUST conform to the following rules:
1. The root object MUST contain a `layoutJson` object and a `componentInstructions` array.
2. The `layoutJson.sections` array contains layout grids. Each section MUST have a `preset` (e.g., "12", "8-4", "4-4-4", "6-6") and a `columns` array.
3. Each column MUST have a `span` (mapping to Tailwind's 12-column grid, e.g., 4, 6, 8, 12) and a `blocks` array.
4. Each block in `layoutJson` MUST have an `id` string (e.g., "hero-1") and a `type` string corresponding to a predefined component (e.g., "hero", "post-list", "faq").
5. The `componentInstructions` array MUST contain an instruction object for EVERY block `id` defined in the layout. Each instruction MUST include the `id`, an `instruction` textual description of the block's visual context/intent, and a `queriesToUse` string array.

Do not write HTML, CSS, or Tailwind classes directly.
Do not output any markdown formatting, only pure, raw JSON.

Example Valid JSON:
{
  "layoutJson": {
    "sections": [
      {
        "preset": "8-4",
        "columns": [
          { "span": 8, "blocks": [{ "id": "block-1", "type": "featured-post" }] },
          { "span": 4, "blocks": [{ "id": "block-2", "type": "post-list" }] }
        ]
      }
    ]
  },
  "componentInstructions": [
    { "id": "block-1", "instruction": "Show the main featured NYT article with a large image.", "queriesToUse": ["getFeaturedNews"] },
    { "id": "block-2", "instruction": "Show the latest 5 posts in a sidebar.", "queriesToUse": ["getLatestPosts"] }
  ]
}
```
