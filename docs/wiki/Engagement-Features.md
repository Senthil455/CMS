# Engagement Features

CMS includes built-in social and engagement features to enhance user interaction.

---

## Feature Overview

| Feature | Description | Data Tracked |
|---------|-------------|--------------|
| **Views** | Page/content view tracking | Count per record |
| **Likes** | User appreciation | Count + per-user state |
| **Shares** | Social sharing (X, email, Reddit, clipboard) | Count + per-user state |
| **Bookmarks** | Save content to folders | Folder structure + per-user |
| **Toplist** | Popularity ranking | Aggregated scores |
| **Page Tracking** | Analytics & visit history | URL, timestamp, user |
| **Notifications** | User activity alerts | Unread count |

---

## Architecture

### Backend (**cms** repo)

The **CMS** backend handles all engagement data with buffered writes for performance:

```
User Action → API Call → Memory Buffer → Batch Write (every minute) → Database
```

**Performance:**
- P95 latency: 19ms at 4,200 QPS
- Supports 100M+ activity records
- Sharding-ready for large-scale deployments

### Frontend (**cms** repo)

The SDK in `packages/backend/public/` provides client-side access. See [Page Templates & Interactivity](./Page-Templates-Interactivity.md#page--sdk-interaction) for SDK usage details.

---

## Feature Details

### Views
- **Automatic**: Tracked on page load via `trackVisit()`
- **Display**: Show view count in UI
- **Unique**: Can track unique vs. total views

### Likes
- **Toggle**: Click to like/unlike
- **State**: Remembers user's like status
- **Count**: Displays total likes

### Shares
Built-in share dialog supports:
- **X (Twitter)** – Opens tweet composer
- **Email** – Opens mail client
- **Reddit** – Opens Reddit submit
- **Clipboard** – Copies URL

### Bookmarks
- **Folders**: Users organize bookmarks into custom folders
- **Dialog**: UI for folder selection/creation
- **Persistent**: Stored per-user in database

### Toplist
- **Popularity scoring** based on engagement metrics
- **Configurable** weighting (views vs. likes vs. shares)
- **Use cases**: "Trending Posts", "Top Courses", "Popular Items"

### Page Tracking
- **Visit history** per user
- **Analytics integration** ready
- **Privacy-aware** (respects user settings)

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/engagements/{entity}/{id}` | GET | Get stats for a record |
| `/api/engagements/toggle/{entity}/{id}` | POST | Toggle like/share |
| `/api/engagements/visit` | GET | Track page visit |
| `/api/bookmarks/{entity}/{id}` | POST | Save bookmark |
| `/api/bookmarks/folders/{entity}/{id}` | GET | Get user's bookmark folders |
| `/api/notifications/unread` | GET | Get unread notification count |

---

## Integration

### Adding Engagement Bar to a Page

The AI Page Builder automatically includes the Engagement Bar component. It uses Handlebars + Alpine.js:

```html
<div x-data="{ ... }" x-init="window.cmsSdk.engagementService.getStats('{{entityName}}')">
    <!-- Like, Share, Bookmark buttons -->
</div>
```

See [Page Templates & Interactivity](./Page-Templates-Interactivity.md) for SDK details.

---

## Best Practices

1. **Always seed data** – Engagement features need records to track
2. **Use buffered writes** – Default behavior, don't disable for high-traffic sites
3. **Consider caching** – Engagement counts can be cached at CDN level
4. **Privacy** – Respect user preferences for tracking
