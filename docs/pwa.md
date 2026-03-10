```markdown
# CMS PWA Feature Design

## Overview

CMS currently supports:

- **SSR pages** using Handlebars
- **CRUD REST APIs**
- **GraphQL APIs**
- Frontend apps built with **React or native mobile apps**

However, **native mobile apps require App Store review**, which slows deployment and iteration.

To solve this, CMS can support **Progressive Web Apps (PWA)** so users can install apps directly from the browser and use them **offline**.

This allows CMS users to build installable apps that can:

- Read articles offline
- Play MP3/audio offline
- Watch videos offline
- Run web games
- Track user activity and sync to server

---

# Goals

Allow CMS users to build **installable offline web apps** without publishing to the App Store.

Users should be able to:

- Install app to phone home screen
- Use the app offline
- Cache content locally
- Track actions locally
- Sync data when online

---

# Architecture

```

CMS
├─ Page Builder
│   ├─ SSR page (Handlebars)
│   ├─ SPA page (React)
│   └─ PWA page
│
├─ APIs
│   ├─ CRUD REST
│   └─ GraphQL
│
└─ PWA Infrastructure
├─ manifest.json generator
├─ service worker
├─ offline cache
├─ IndexedDB storage
└─ background sync

````

---

# PWA Core Components

## 1. Web App Manifest

Defines installable app metadata.

Example:

```json
{
  "name": "CMS App",
  "short_name": "CMS",
  "start_url": "/pwa",
  "display": "standalone",
  "theme_color": "#111827",
  "background_color": "#ffffff"
}
````

This allows browsers like Safari or Chrome to show **Add to Home Screen**.

---

## 2. Service Worker

Service workers provide offline support.

Responsibilities:

* Cache pages
* Cache API responses
* Cache media
* Intercept network requests
* Sync offline data

Example caching strategies:

| Resource  | Strategy               |
| --------- | ---------------------- |
| HTML      | stale-while-revalidate |
| API       | network-first          |
| images    | cache-first            |
| mp3/video | cache-first            |

---

## 3. Local Storage

Offline data should be stored using **IndexedDB**.

Example structure:

```
indexedDB
 ├─ content
 │   ├─ article
 │   ├─ video
 │   └─ mp3
 │
 ├─ user-data
 │   ├─ view-history
 │   ├─ bookmarks
 │   └─ likes
 │
 └─ sync-queue
```

---

# Offline Features

## Offline Articles

Users can read cached articles without internet.

Workflow:

```
Load article
     ↓
Save to IndexedDB
     ↓
Offline access
```

---

## Offline Media

Media such as MP3 or video can be downloaded and cached locally.

Workflow:

```
User plays media
     ↓
Service worker downloads file
     ↓
Cache locally
     ↓
Play offline later
```

---

## Offline History Tracking

User actions are recorded locally.

Example record:

```
view-history
{
  contentId
  timestamp
  synced:false
}
```

When network returns:

```
sync queue → server API
```

---

# Sync Architecture

```
User Action
    ↓
Local IndexedDB
    ↓
Sync Queue
    ↓
Server API
    ↓
Database
```

Data types that can sync:

* view history
* likes
* bookmarks
* form submissions
* progress tracking

---

# Page Builder Support

CMS page builder should support a **PWA rendering mode**.

Example page metadata:

```json
{
  "name": "article",
  "renderMode": "pwa",
  "offline": true,
  "cacheStrategy": "staleWhileRevalidate"
}
```

---

# Recommended PWA Structure

Instead of multiple separate PWAs, use **one PWA shell**.

```
/pwa
 ├─ articles
 ├─ music
 ├─ videos
 ├─ games
 └─ history
```

Benefits:

* single installation
* shared storage
* shared authentication
* simpler sync

---

# PWA Builder Blocks

To simplify development, CMS should provide **PWA blocks** that users can drag into pages.

## Core Blocks

| Block          | Purpose                    |
| -------------- | -------------------------- |
| Install App    | Prompt user to install PWA |
| Offline Status | Show online/offline state  |
| Sync Status    | Show pending sync items    |

---

## Content Blocks

| Block           | Purpose                 |
| --------------- | ----------------------- |
| Offline Article | Cache and read articles |
| Offline List    | Cache API lists         |
| Image Gallery   | Cached images           |

---

## Media Blocks

| Block        | Purpose                |
| ------------ | ---------------------- |
| Audio Player | Offline MP3 playback   |
| Video Player | Offline video playback |

---

## User Interaction Blocks

| Block        | Purpose             |
| ------------ | ------------------- |
| Bookmark     | Save content        |
| Like         | Reaction system     |
| View History | Track user activity |

---

## Data Blocks

| Block             | Purpose            |
| ----------------- | ------------------ |
| Local Storage     | Small settings     |
| IndexedDB Storage | Large offline data |

---

## Offline Form Block

Allows forms to work offline.

Example:

```
User submits form offline
      ↓
Queue locally
      ↓
Sync when online
```

---

## Game Block

Allows embedding games.

Possible sources:

* iframe
* WebGL
* canvas

Game assets can be cached offline.

---

# Example Apps Built With CMS PWA

## Podcast App

Blocks:

* Offline List
* Audio Player
* Download Manager
* History

---

## Learning Platform

Blocks:

* Course List
* Video Player
* Offline Articles
* Quiz
* Progress Sync

---

## Reading App

Blocks:

* Article List
* Offline Reader
* Bookmark
* History

---

## Game Platform

Blocks:

* Game Block
* Local Storage
* Leaderboard Sync

---

# Advantages of PWA Approach

Compared to native apps:

| Feature            | Native App | PWA          |
| ------------------ | ---------- | ------------ |
| App store approval | required   | not required |
| Offline support    | yes        | yes          |
| Updates            | slow       | instant      |
| Install            | app store  | browser      |

---

# Summary

Adding **PWA support** to CMS enables users to build:

* installable mobile apps
* offline content platforms
* media players
* educational apps
* games

All without publishing to the App Store.

Core components include:

* manifest generation
* service workers
* IndexedDB storage
* background sync
* PWA builder blocks

This transforms CMS from a CMS into a **platform for building installable offline web apps**.

```
```
