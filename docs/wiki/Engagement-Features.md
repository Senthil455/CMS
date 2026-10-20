# Engagement Features

Engagement is implemented by the **ASP.NET Core CMS** and consumed by generated pages through the browser SDK. The Node service in this repository does not store or compute likes, views, shares, or bookmarks; it only serves the SDK and the AI prompts that generate engagement UI.

---

## 1. Feature map

| Feature | UI | Data owner |
|---|---|---|
| Views / visit tracking | Page head or engagement bar | CMS engagement tables |
| Likes | Engagement bar | CMS engagement tables |
| Shares | Engagement bar + share dialog | CMS engagement tables |
| Bookmarks | Engagement bar, bookmark dialog, Stash, Portal | CMS bookmark tables |
| Toplist | Top list component / Stash Explore | CMS query over engagement data |
| Notifications | Portal, user avatar menu | CMS notifications |
| Reading history | Portal | CMS activity data |

Because the CMS source is not in this repository, the exact write strategy (buffering, batching, indexing) and any performance numbers are **not verifiable here**. Treat claims about CMS throughput or latency as CMS-side documentation, not repository facts.

---

## 2. Backend surface

The browser SDK calls these CMS endpoints directly:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/engagements/:entity/:id` | Stats for one record: `{ view, like, share, bookmark }`, each `{ count, active }` |
| `POST` | `/api/engagements/toggle/:entity/:id/?type=like&active=true` | Toggle like or share for the current user |
| `POST` | `/api/engagements/mark/:entity/:id?type=…` | Record an activity event |
| `GET` | `/api/engagements/visit?url=…` | Track a page visit |
| `GET` | `/api/bookmarks/folders/:entity/:id` | Folders available for this record |
| `POST` | `/api/bookmarks/:entity/:id` | Save a bookmark |
| `GET` | `/api/notifications/unread` | Unread notification count |

The shared constants also define management and analytics paths:

| Path | Purpose |
|---|---|
| `/api/engagements/list/:type` | List engagement records |
| `/api/engagements/counts` | Counts |
| `/api/engagements/page-counts` | Counts grouped by page |
| `/api/engagements/visit-counts` | Visit counts |
| `/api/engagements/delete/:id` | Delete an engagement |
| `/api/bookmarks/folders` | Create/list folders |
| `/api/bookmarks/list/:folderId` | Bookmarks in a folder |
| `/api/bookmarks/folders/update/:id` | Rename/update a folder |
| `/api/bookmarks/folders/delete/:id` | Delete a folder |
| `/api/bookmarks/delete/:id` | Delete a bookmark |
| `/api/notifications` | Notification list/management |

All calls use cookies and rely on the CMS for authentication. Unauthenticated users can usually read counts but must log in to toggle or bookmark; the SDK calls `userService.ensureLogin()` first.

---

## 3. Engagement bar

The `engagement-bar` component is generated into **detail pages** by `page_engagement_bar_builder`.

Typical contract:

```html
<div x-data="{
  entityName: 'book',
  stats: { view: {count:0}, like: {count:0,active:false},
           share: {count:0,active:false}, bookmark: {count:0,active:false} },
  init() {
    window.cmsSdk.engagementService.getStats(this.entityName)
      .then(s => this.stats = s);
  },
  toggle(type) {
    window.cmsSdk.engagementService.toggle(this.entityName, type, this.stats);
  }
}" x-init="init()">
  <button @click="toggle('like')">♥ <span x-text="stats.like.count"></span></button>
  <button @click="toggle('share')">↗ <span x-text="stats.share.count"></span></button>
  <button @click="toggle('bookmark')">🔖</button>
</div>
```

Key behavior:

- The record ID comes from `<meta name="record-id">`, with the last URL segment as fallback.
- `getStats()` standardizes missing types to `{ count: 0, active: false }` and swallows errors, so a broken endpoint shows zeros rather than an error.
- `toggle()` updates counts optimistically, then calls the API. If the request fails, it logs the error; there is no automatic rollback.
- Bookmarking opens a folder dialog; sharing opens a platform dialog.

---

## 4. Bookmarks

Bookmarks are stored by the CMS and surfaced in three places:

| Surface | Behavior |
|---|---|
| Generated pages | Engagement bar → bookmark dialog → `/api/bookmarks/:entity/:id` |
| Stash | Local cache in IndexedDB plus server sync; folder tabs |
| Portal | Bookmark management with folders |

The browser SDK does **not** maintain a bookmark cache. Stash does, and reconciles with the server through its sync queue.

---

## 5. Visit tracking and analytics

Two independent mechanisms exist:

1. **CMS visit tracking** — `LayoutCompiler` injects `cmsSdk.engagementService.trackVisit()` when `enableVisitTrack` is true. It calls `/api/engagements/visit?url=…`.
2. **Google Analytics** — when enabled in Settings, the page head includes `gtag.js` with the configured measurement ID. This is separate from CMS engagement data.

The Studio settings page stores `ENABLE_GOOGLE_ANALYTICS` and `GA_MEASUREMENT_ID` in the service database. Visit tracking is controlled per page compile option, not by a global service setting.

---

## 6. Toplist

`top-list` is a page component and a common Stash pattern. It is generated from a query that orders records by an engagement or popularity field. The ranking formula and available sort fields are defined by the CMS/query, not by the Node service. Inspect the query used by the page to know what is being ranked.

---

## 7. Notifications

Notifications belong to the CMS. The Portal shows notifications and unread counts; generated pages can use the user avatar component to expose a menu. The SDK includes a convenience call for `/api/notifications/unread`.

The service has no notification storage, delivery, or websocket events.

---

## 8. What the AI pipeline contributes

The engagement work in this repository is prompt and layout generation:

| Agent | Produces |
|---|---|
| `page_engagement_bar_builder` | Engagement bar HTML/Alpine |
| `page_user_avatar_builder` | Avatar menu |
| `page_top_list_builder` | Ranked list |
| `page_visit_tracker` (declared) | Visit tracking snippet; the actual injection is handled by `LayoutCompiler` options |

`page_visit_tracker` is present in `AGENT_NAMES` but is not registered as a standalone handler; visit tracking is applied at compile time.

---

## 9. Operational notes

- **Login is required for writes.** Reads may work anonymously depending on CMS policy.
- **Engagement data is CMS data.** Back it up with the CMS database, not the service SQLite file.
- **Counts can drift.** Optimistic UI updates are not rolled back on failure.
- **No local caching layer.** Every stats fetch goes to the CMS through the browser.
- **Privacy.** Visit tracking records URLs; disclose it and respect user preferences in the CMS configuration.

---

## 10. Related pages

- [Page Templates & Interactivity](./Page-Templates-Interactivity.md) — SDK internals and Handlebars constraints
- [API Reference](./API-Reference.md) — full route list
- [Stash](./Stash.md) — offline bookmarks and sync
- [Architecture](./Architecture.md) — why engagement lives in the CMS
