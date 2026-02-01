# Page Templates & Interactivity

This guide covers the technical details of building and customizing pages in CMS.

## Rendering Architecture

CMS uses a hybrid rendering approach for optimal performance and SEO:

```
Handlebars (Server) → SSR HTML → Alpine.js (Client) → Hydration
```

### 1. Server-Side Rendering (Handlebars)
- **Handlebars** templates render the initial HTML on the server.
- Data from GraphQL queries is injected directly into templates.
- The rendered HTML is fully crawlable by search engines.

### 2. Client-Side Hydration (Alpine.js)
- **Alpine.js** adds interactivity after the page loads.
- Uses declarative attributes (`x-data`, `x-on`, `x-bind`) for state and behavior.
- No build step required – scripts run directly in the browser.

---

## SDK Architecture

The client-side SDK is located in the **cms** repo at `packages/backend/public/` and follows a layered architecture:

```
index.js (Entry Point)
├── api/           ← Low-level API calls (fetch)
├── services/      ← Business logic & state
└── components/    ← UI components (dialogs)
```

### Layer Details

| Layer | Purpose | Example Files |
|-------|---------|---------------|
| **api/** | Raw HTTP calls to backend endpoints | `engagement.js`, `user.js` |
| **services/** | Business logic, state management, orchestration | `engagment.js`, `user.js` |
| **components/** | Reusable UI dialogs & widgets | `login-dialog.js`, `bookmark-dialog.js` |

### How It Works

1. `index.js` exports all services.
2. Services import from the `api/` layer for data fetching.
3. Services import from `components/` for UI elements (e.g., login dialog).
4. Pages include the SDK and call service methods.

---

## Page & SDK Interaction

Pages call the SDK via `window.cmsSdk` from Alpine.js components.

### Example: Engagement Bar

The Engagement Bar demonstrates the full pattern:

**1. Alpine.js Component (in page template)**
```html
<div x-data="{
    entityName: '{{entityName}}',
    stats: { view: {}, like: {}, share: {}, bookmark: {} },
    init() {
        // Call SDK on component init
        window.cmsSdk.engagementService.getStats(this.entityName)
            .then(data => this.stats = data);
    },
    toggle(type) {
        window.cmsSdk.engagementService.toggle(this.entityName, type, this.stats);
    }
}" x-init="init()">
    <button @click="toggle('like')">❤️ <span x-text="stats.like.count"></span></button>
</div>
```

**2. Flow**
```
Page Load → Alpine x-init → SDK.getStats() → API call → Update UI
User Click → Alpine @click → SDK.toggle() → API call → Update state
```

### SDK Reference

| Service | Methods | Purpose |
|---------|---------|---------|
| **engagementService** | `getStats()`, `toggle()`, `saveBookmark()`, `share()`, `trackVisit()` | User engagement (likes, shares, bookmarks, views) |
| **userService** | `fetchMe()`, `ensureLogin()` | Authentication & user state |

---

> **Want to add new components?** See the [Contributing Guide](./Contributing.md).
