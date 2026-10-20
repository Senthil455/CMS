# Building a System with CMS

CMS is data-first: define the data model, seed it, query it, then generate pages. The Studio automates each step with agents, and every artifact remains editable afterward.

> **Prerequisite:** a running CMS backend and the Studio open. See [Setup](./Setup.md).

---

## 1. The workflow

```text
Entity definition → Relationships → Seed data → Named query → Page plan → Page build → Publish
```

You can drive the whole sequence from one prompt (*"Build a library management system"*), or run the steps one at a time. Running them one at a time is easier to review and debug.

---

## 2. Entities

An **entity** is a content type: `Book`, `Author`, `Order`, `Article`. Each entity becomes a CMS schema and a database table with real columns.

### How to create one

In the Studio explorer, use **Add → Entity**, or ask the chat:

> *"Create a Book entity with title, subtitle, isbn, price, publishedAt, coverImage, and a description."*

`entity_designer` returns a plan with attributes and relationships. Review the confirmation card in chat, adjust anything that is wrong, and confirm. The entity is written to the CMS and appears in the explorer.

### Attribute types

The exact type list belongs to the CMS, but generated entities typically use:

| Kind | Examples |
|---|---|
| Text | `string`, `text`, `markdown` |
| Numeric | `integer`, `decimal`, `float` |
| Boolean | `boolean` |
| Date/time | `datetime`, `date` |
| Media | image/file references |
| Relations | lookup, junction, collection |

### Editing

Select an entity in the explorer to open the detail panel. You can edit attributes and settings, inspect the schema graph, test the generated API, and view version history.

### Relationships

| Relationship | Meaning | Example |
|---|---|---|
| **Lookup** | Many-to-one. The record stores a reference to one record in another entity. | A `Book` belongs to one `Publisher`. |
| **Junction** | Many-to-many through a join. | A `Book` has many `Author`s; an `Author` has many `Book`s. |
| **Collection** | One-to-many owned by the parent record. | An `Order` owns many `OrderItem`s. |

Relationship metadata is stored on the CMS schema. The agents use it when generating nested queries and relationship-aware UI.

---

## 3. Seed data

The page agents need realistic data to infer field usage and produce useful previews.

Ask:

> *"Add 20 sample books with plausible titles, prices, and authors."*

`data_synthesizer` generates records and inserts them through the CMS API. You can also insert records manually from **Admin → Data**, or use **AI generate** on an individual record form (`POST /cmsapi/ai/generate-data`).

Guidance:

- Seed **after** relationships exist, so foreign keys resolve.
- Seed enough rows to exercise pagination and empty states (20–50 is usually enough).
- Seed related entities first when the CMS enforces referential integrity.

---

## 4. Queries

Queries are named GraphQL operations stored as CMS query schemas. Each one is also exposed as a REST endpoint at `/api/queries/:id`.

Ask:

> *"Create a query that returns available books with title, price, cover image, and author names, sorted by publish date."*

`query_builder` writes the GraphQL, validates it against the schema, and saves it. The Studio shows:

- the GraphQL source (Monaco editor with schema-aware completion),
- an endpoint preview,
- a test runner.

You can edit the query manually and re-run it. Queries used by pages are referenced by page metadata; changing a query changes what the page receives.

### Example shape

```graphql
query AvailableBooks {
  books(filter: { available: true }, orderBy: { publishedAt: DESC }) {
    id
    title
    price
    coverImage
    authors {
      name
    }
  }
}
```

The exact filter and ordering syntax is defined by the CMS GraphQL implementation, not by this repository.

---

## 5. Pages

A page combines a plan, a layout, components, a query, and a design style.

### 5.1 Planning

Ask:

> *"Build a book list page with search and an engagement bar."*

`page_planner` decides:

- page type (`list` or `detail`),
- entity and query,
- page name and route,
- design template/style.

The planner asks for confirmation when a choice is ambiguous.

### 5.2 Architecture

`page_architect` designs the layout: an ordered list of sections, each with 12-column spans and component slots. It selects from the page component registry:

| Component | Page types | Purpose |
|---|---|---|
| Common component | any | Custom HTML section |
| Engagement bar | detail | Like, share, bookmark, view counts |
| User avatar | detail, list | Signed-in user menu |
| Top list | detail, list | Ranked/trending items |
| Search bar | list | Query/filter input |
| Data list | list | Repeat records from a query |
| Pagination | list | Cursor-based navigation |
| Breadcrumb | detail | Navigation trail |
| Detail hero | detail | Title, image, metadata |
| Table view | list | Tabular records |
| Contact form | detail, list | Form submission UI |
| Image carousel | detail | Image gallery |
| FAQ accordion | detail, list | Expandable Q&A |

`related_items` exists in the resource tree but is currently **commented out** of the registry.

### 5.3 Component generation

Each component has a dedicated agent under `src/agent/page-components/<component>/`. The agent receives the page plan, the query, the component prompt, and its snippet, then returns HTML.

The Studio compiles sections and components with `LayoutCompiler` into a full HTML document and stores it on the page schema. You can edit the generated source directly, regenerate a single component, or ask:

> `@modify-component <schemaId> <componentId> Add a compact variant for mobile.`

### 5.4 Preview and publish

The page detail panel includes a preview and a publish action. Publishing writes the page through the CMS. Generated pages are served by the CMS at their configured route.

---

## 6. A complete example

```text
You: Design entities for a library management system with books, authors, and publishers.

CMS: [entity plan] → confirm → three entities created

You: Add 20 books and 8 authors with realistic data.

CMS: [data plan] → records inserted

You: Create a query that lists books with their authors and publisher.

CMS: [query plan] → saved → endpoint /api/queries/<id>

You: Build a book list page with search, pagination, and an engagement bar.

CMS: page_planner → page_architect → data_list + search_bar + pagination
     + engagement_bar agents → compiled HTML saved to the page

You: Publish the page.
```

Each step produces an `AiResponseLog`. If something goes wrong, use `@replay <logId>` to re-run the stored plan without another model call.

---

## 7. Reviewing and fixing output

| Symptom | Fix |
|---|---|
| Entity has the wrong field type | Edit the entity in the detail panel, or ask `@entity_designer` to revise it |
| Seed data violates a relationship | Re-seed the parent entity first, or reduce the batch size |
| Query returns nothing | Run it in the query tester; check filters and whether the entity has data |
| Page section is empty | Confirm the bound query returns rows and the component has a valid `data` expression |
| Component looks wrong | Use `@modify-component` targeting that component ID |
| Agent plan was wrong | Reject it in the confirmation card; nothing is written until you confirm |
| Pipeline stopped mid-task | Open the task list and use `@execute-task <id>` |

---

## 8. What the Studio does not do

- It does not design the CMS database schema directly; it calls CMS APIs.
- It does not render pages server-side. Pages are generated HTML with client-side Alpine.js and a browser SDK.
- It does not enforce a validation gate between agents. A malformed plan can fail downstream; check confirmations and logs.
- It does not provide undo for CMS writes. Use CMS schema history and version control around generated artifacts.

---

## 9. Next steps

- [Orchestrator Strategy](./Orchestrator-Strategy.md) — what happens between your prompt and the CMS write
- [Page Templates & Interactivity](./Page-Templates-Interactivity.md) — the generated HTML contract
- [Engagement Features](./Engagement-Features.md) — adding social features to a page
- [API Reference](./API-Reference.md) — endpoints used at each step
