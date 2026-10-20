# Page Templates & Interactivity

Generated pages are **HTML documents with Handlebars placeholders, Alpine.js directives, and a browser SDK**. This page documents how those pieces fit together and what belongs to this repository versus the CMS.

---

## 1. Where rendering happens

```text
Studio / page agents
  → HTML components + layout sections
  → LayoutCompiler (packages/shared)
  → full HTML document saved to the CMS page schema
  → CMS renders HandlebarsDotNet against query results
  → browser runs Alpine.js + /static/index.js
```

| Stage | Owner |
|---|---|
| Layout assembly and component HTML | This repository (`LayoutCompiler`, page agents) |
| HandlebarsDotNet rendering | ASP.NET Core CMS |
| Data loading | CMS (`/api/page-data`) |
| Client interactivity | Alpine.js CDN + `/static/index.js` |
| Preview | Studio iframe; uses Handlebars.js client-side for preview only |

The Node service does **not** render pages server-side. The Studio preview compiles Handlebars in the browser so you can see data before publishing; that is a preview convenience, not the production renderer.

---

## 2. LayoutCompiler

`packages/shared/src/utils/layout-compiler.ts` assembles a document from `LayoutSection[]` and `PageComponent[]`.

```typescript
LayoutCompiler.compile(sections, components, title, options)
```

### Structure

- `<head>` includes:
  - Tailwind CDN (`cdn.tailwindcss.com`)
  - Alpine.js 3 CDN
  - Google Fonts (Inter)
  - `marked` 12.0.2 for `.markdown-content`
  - a module script that imports `/static/index.js` and assigns `window.cmsSdk`
  - optional Google Analytics `gtag`
  - optional visit tracking (`cmsSdk.engagementService.trackVisit()`)
  - a `<meta name="record-id" content="{{id}}">` tag used by the SDK
  - an optional custom header string
- `<body>` contains one 12-column grid per section:

```html
<div class="grid grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4">
  <div class="col-span-12 md:col-span-8">
    <div data-component-id="component-id">…component HTML…</div>
  </div>
</div>
```

`compileBody()` returns only the body grid, which is useful for embedded or partial pages.

### Implication

Because the head is fixed, every generated page depends on external CDNs at runtime. If a CDN is blocked, styling or interactivity degrades even though the page HTML is stored locally.

---

## 3. Handlebars contract

Templates are evaluated by **HandlebarsDotNet** on the CMS, not by Handlebars.js. The component prompts encode the supported subset:

| Feature | Supported form |
|---|---|
| Value | `{{title}}`, `{{author.name}}` |
| Raw HTML | `{{{content}}}` only for fields known to contain HTML |
| Loop | `{{#each items}} … {{/each}}`, `{{this.field}}` |
| Condition | `{{#if field}} … {{/if}}` (truthiness only) |
| Index | `{{@index}}` |
| Value helpers | `{{gt a b}}`, `{{lt a b}}`, `{{eq a b}}`, `{{ne a b}}`, `{{gte a b}}`, `{{lte a b}}` |
| Closing tags | `{{/if}}`, `{{/each}}` with no arguments |

Known constraints:

- No sub-expressions inside block helpers (`{{#if (gt @index 2)}}` is invalid).
- No array index access (`{{items.0}}` is invalid).
- No JavaScript expressions (`.length`, `Math.*`).
- Image fields are asset objects: use `{{image.url}}`, not `{{image}}`.
- Avoid inline comments with long explanations.

These constraints exist because preview (Handlebars.js) is more permissive than production (HandlebarsDotNet). Code that previews correctly can still fail after publishing if it uses unsupported syntax.

---

## 4. Alpine.js

Components use Alpine for local UI state:

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">…</div>
</div>
```

Alpine is loaded with `defer` from a CDN. It is appropriate for dropdowns, modals, accordions, and tabs. It is **not** a data layer: record data comes from Handlebars at render time, and engagement/bookmark state comes from the SDK.

Common patterns in generated components:

- `x-init` to fetch engagement stats
- `x-show`/`x-transition` for dialogs and sheets
- `@click` handlers that call `window.cmsSdk`
- `x-text` for counts

---

## 5. Browser SDK

The SDK is served at `/static/index.js` from `packages/service/public/static/`.

```text
index.js
├── api/
│   ├── engagement.js   HTTP calls for engagement and bookmarks
│   └── user.js         /api/me, /api/login
├── services/
│   ├── engagment.js    engagementService (note the spelling)
│   └── user.js         userService
└── components/
    ├── login-dialog.js
    ├── bookmark-dialog.js
    └── share-dialog.js
```

`index.js` re-exports both services. Generated pages access them as `window.cmsSdk`.

### `engagementService`

| Method | Purpose |
|---|---|
| `getStats(entityName)` | Fetch `{ view, like, share, bookmark }`, each `{ count, active }` |
| `toggle(entityName, type, stats)` | Ensure login, then toggle like/share/bookmark; updates local stats optimistically |
| `saveBookmark(entityName, stats)` | Open the folder dialog and save |
| `share(entityName, stats)` | Open the share dialog (X, email, Reddit, clipboard) |
| `trackVisit()` | Called from the page head when visit tracking is enabled |

The record ID comes from `<meta name="record-id">`, falling back to the last URL segment.

### `userService`

| Method | Purpose |
|---|---|
| `fetchMe()` | GET `/api/me` with cookies |
| `login()` | Show the login dialog and POST `/api/login` |
| `ensureLogin()` | Return the current user or prompt for login |

The SDK uses cookies (`credentials: 'include'`) and same-origin `/api` paths. It does not use the Node `/cmsapi` routes.

---

## 6. Page types

| Type | Typical components | Data shape |
|---|---|---|
| **List** | search bar, data list or table, pagination, top list | A collection, often paginated |
| **Detail** | breadcrumb, detail hero, engagement bar, carousel, FAQ, related items | One record plus relations |

The page planner picks the type and the design style; the architect chooses components. The component registry enforces page-type compatibility (`pageTypes` in `PAGE_COMPONENT_REGISTRY`).

---

## 7. Adding or changing a component

1. Add or edit `packages/service/src/agent/page-components/<component>/prompt.md`.
2. Optionally add `snippet.html` for a reference fragment.
3. Register the component in `src/agent/page-components/index.ts` with a unique `id`, `agentName`, `resourceDir`, page types, and icon metadata.
4. Add the agent name to `AGENT_NAMES` if it is new.
5. Restart the service. Prompts are loaded at startup for every provider.
6. Use `@modify-component <schemaId> <componentId> …` to regenerate existing components.

`related_items` is a useful example of a component that is present in resources but not registered.

---

## 8. Styling

Generated components use **Tailwind CSS v3 utility classes** via the CDN, plus inline styles where needed. Design styles stored in the service database supply list/detail prompt guidance (tone, spacing, palette), but they do not ship CSS files. There is no build step for generated pages.

The Studio itself uses Tailwind 4 and its own design tokens; do not confuse the Studio theme with the generated-page styling contract.

---

## 9. Interactivity limits

- No framework runtime beyond Alpine and the SDK.
- No client-side routing; links are normal navigations.
- Engagement calls fail quietly (stats fall back to zeros) when the CMS endpoints are unavailable.
- The SDK is global (`window.cmsSdk`), not module-scoped per component.
- Generated pages are not hydration-based; re-rendering means a full page load.

---

## 10. Related pages

- [Engagement Features](./Engagement-Features.md) — endpoint behavior behind the engagement bar
- [Building a System](./Building-a-System.md) — page planning and generation workflow
- [Contributing](./Contributing.md) — component checklist
