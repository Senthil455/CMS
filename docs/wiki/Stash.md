# Stash — PWA Companion App

**Stash** is a Progressive Web App (PWA) built on top of CMS that delivers a native mobile-app experience for consuming and managing content — no App Store required. Install it from the browser on iPhone or Android and it works just like a native app.

> **💡 Why a PWA?** Stash uses browser APIs (Web Speech, IndexedDB, Service Worker) to deliver features that feel like a native iPhone/Android app — without the overhead of publishing to an app store.

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Explore** | Browse trending content from your CMS backend and start reading/listening instantly. |
| **Bookmarks** | Save content into folders — bookmarked items are cached on-device via IndexedDB for instant offline access. |
| **Text-to-Speech** | Read any article aloud with mixed-language support (English + Chinese). Progress is saved across sessions. |
| **Assets** | Download audio/video by pasting a URL. Convert to **MP3** (original quality) or **M4A** (64 kbps compressed). |
| **Offline Player** | Play downloaded files fully offline. Playback progress is saved so long audio/video resumes where you left off. |

---

## Navigation

Stash uses a floating bottom navigation bar with four tabs:

| Tab | Icon | Description |
|-----|------|-------------|
| **Explore** | Compass | Browse and discover trending content |
| **Bookmarks** | Bookmark | View and manage saved items (requires login) |
| **Assets** | HardDrive | Manage downloaded media files (requires login) |
| **Offline** | WifiOff | Play locally-stored audio/video files |

---

## Pages

### Explore

The default landing page. It fetches a `topList` query from the CMS backend and displays trending content as a visually rich list. Each item shows a thumbnail, title, subtitle, and publish date.

**Key actions:**
- **Tap an item** → Opens the Transcript Sheet and starts Text-to-Speech playback. The app first plays with the teaser content, then fetches the full article body (`contentTag` query) and seamlessly switches to the complete text.
- **Bookmark icon** → Opens the Bookmark Dialog to save the item into a folder.

### Bookmarks

Displays all bookmarked content, organized by folders. Data is stored locally in IndexedDB and synced with the server when online.

**Key actions:**
- **Folder tabs** → Filter bookmarks by folder.
- **Tap an item** → Starts TTS playback with playlist navigation support.
- **Delete icon** → Removes a bookmark (with confirmation).
- **Offline indicator** → Shows an "Offline" badge when the device has no network.

### Assets

A media management page for downloading and converting audio/video content.

**Key actions:**
- **Add button (FAB)** → Opens the Add Asset dialog. Automatically checks the clipboard for URLs.
- **Tap an asset** → Opens the Asset Detail Sheet with metadata and conversion options.
- **Convert to MP3** → Re-encodes the file at original quality (larger file size).
- **Convert to M4A** → Compresses to 64 kbps AAC (smaller file size).
- **Delete** → Removes the asset from the server.

Assets are filtered by tab: **All**, **Video**, **Audio**, **Image**.

### Offline

A local media library for playing audio and video files stored on the device.

**Key actions:**
- **Add files** → Use the file picker to add audio/video from your device.
- **Tap to play** → Opens the built-in Offline Player.
- **Progress memory** → Playback position is saved per file so long content (lectures, podcasts) resumes where you left off.

> **iOS Note:** On iPhone/iPad, files need to be re-selected after you close the app. Just tap Play and pick the same file — playback will resume where you left off.

---

## Text-to-Speech (TTS) System

The TTS system is one of Stash's key features, providing a read-aloud experience with progress memory and mixed-language support.

### Architecture

The TTS system is decomposed into focused sub-hooks following the single responsibility principle:

| Module | Responsibility |
|--------|---------------|
| `useTTSVoices` | Loads available voices, filters preferred English/Chinese voices, provides `pickVoice()` |
| `useTTSContent` | Parses HTML content into plain text, splits into sentence-level chunks, detects language per chunk |
| `useTTSProgress` | Saves/loads reading progress per content key using `localStorage` |
| `useSpeechSynthesis` | Orchestrates the above hooks into a unified playback API (play, pause, resume, stop, seek, rate, voice) |
| `TTSContext` | React Context provider that exposes the TTS API app-wide, plus playlist navigation (next/previous) |
| `TranscriptSheet` | Bottom sheet UI showing the live transcript with highlighted current sentence |

### Mixed-Language Support

Stash can speak articles that contain both English and Chinese text. The content is split into sentence-level chunks, and each chunk's language is detected independently. The system selects the appropriate voice for each chunk:

- **English preferred voices:** Daniel, Samantha, Karen, Google, Natural, Premium, Enhanced
- **Chinese preferred voices:** Meijia, Mei-Jia, Sin-ji, Ting-Ting, Yu-shu, Yu-Shu

### Progress Memory

Reading progress is saved per content key (format: `{entityName}_{recordId}`). When you return to an article, playback resumes from the exact sentence where you left off — even across browser sessions.

### Playlist Navigation

When TTS is started from Explore or Bookmarks, the current list is registered as a playlist. The Transcript Sheet then shows **Previous** and **Next** buttons to navigate between items without leaving the player.

---

## Offline Architecture

Stash is designed to work offline using several browser technologies:

### IndexedDB Storage

The app uses IndexedDB (via the `idb` library) with the following stores:

| Store | Purpose |
|-------|---------|
| `bookmarks` | Cached bookmark items for offline browsing |
| `bookmark-folders` | Cached folder structure |
| `offline-files` | Metadata for locally-stored audio/video files |
| `metadata` | General key-value metadata (sync timestamps, etc.) |

### Background Sync

The `SyncManager` component handles automatic background syncing:
- Detects online/offline status changes
- Syncs bookmarks and folders with the server when connectivity is restored
- Displays sync status via the `StatusBar`

### Service Worker

Stash is configured as a PWA with a Service Worker for caching static assets, enabling the app shell to load even without network connectivity.

---

## Tech Stack

| Technology | Usage |
|------------|-------|
| **React + Vite** | UI framework and build tool |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling with a custom zen/sage design system |
| **Framer Motion** | Page transition animations |
| **SWR** | Data fetching with caching for the Explore page |
| **IndexedDB (idb)** | Client-side storage for bookmarks and offline files |
| **Web Speech API** | Text-to-Speech engine |
| **Lucide React** | Icon library |
| **@cms/sdk** | CMS SDK for authentication, assets, and CMS API |

---

## Design System

Stash uses a **zen/sage** design language characterized by:

- Muted sage green tones with warm neutrals
- Glassmorphism effects (`bg-glass`, `backdrop-blur-zen`)
- Rounded corners (`rounded-2xl`, `rounded-3xl`)
- Smooth micro-animations and hover effects
- Floating bottom navigation bar
- Consistent card-based layouts with subtle shadows

---

## Getting Started

### Development

```bash
# From the monorepo root
npm run dev:stash
```

### Accessing Stash

Once running, Stash is served at `/stash` on your CMS instance (e.g., `http://localhost:5000/stash`).

### Installing as PWA

1. Open the Stash URL in your mobile browser (Safari on iOS, Chrome on Android)
2. Tap "Add to Home Screen" (or equivalent)
3. Stash will appear as an app icon and launch in standalone mode
