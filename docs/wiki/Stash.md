# Stash — Offline PWA

**Stash** is an installable PWA served at `/stash/`. It provides offline reading/listening, text-to-speech, media download/conversion, and a local player. It uses IndexedDB, the Web Speech API, and a service worker; there is no app-store build.

---

## 1. Features

| Feature | Behavior |
|---|---|
| **Explore** | Loads a CMS query (typically a toplist), shows cover, title, subtitle, and publish date |
| **Bookmarks** | Folder tabs, cached content, sync with the CMS when online; requires login |
| **Assets** | Download media by URL, convert to MP3/M4A/M4B, delete remote assets; requires login |
| **Offline** | Add local audio/video files, play them, resume playback position |
| **TTS** | Read articles aloud with per-sentence language detection and progress memory |
| **Sleep timer** | Global playback timer (`SleepTimerContext`) |

Navigation is a floating bottom bar: Explore, Bookmarks, Assets, Offline.

---

## 2. Pages

### Explore

- Fetches the configured trending query through the SDK/CMS.
- Tapping an item opens `TranscriptSheet` and starts TTS.
- Playback starts with teaser content, then swaps to the full article when the `contentTag` query resolves.
- Bookmark action opens `BookmarkDialog`.

### Bookmarks

- Reads from IndexedDB first, then refreshes from the CMS.
- Folder filter, playlist navigation, delete with confirmation.
- Shows an offline badge when `navigator.onLine` is false.

### Assets

- FAB opens the add-asset dialog and checks the clipboard for a URL.
- Detail sheet shows metadata and conversion actions.
- Tabs: All, Video, Audio, Image.
- Conversion polls asset progress until complete.

### Offline

- Adds local files via the file picker.
- Stores metadata and playback progress; the file itself remains in browser-managed storage.
- iOS may require re-selecting the file after the app is closed; progress resumes from the saved offset.

---

## 3. TTS architecture

There is **no `TTSContext`**. Playback is composed from hooks and a sheet component:

| Module | Responsibility |
|---|---|
| `useTTSVoices` | Load voices, filter preferred English/Chinese voices, `pickVoice()` |
| `useTTSContent` | Convert HTML to text, split into sentence chunks, detect language per chunk |
| `useTTSProgress` | Save/load offset per content key (localStorage + IndexedDB) |
| `useTTSEngine` | Speak chunks with `SpeechSynthesisUtterance`, handle boundary/end/error events |
| `useTTSPlayback` | Position, rate, play/pause/stop state |
| `useTTSPlayer` | Combine the hooks and expose playlist navigation (next/previous) |
| `useTTSSettings` | Persist voice/rate preferences |
| `useSpeechSynthesis` | Compatibility facade over the player hooks |
| `TranscriptSheet` | Bottom sheet with live transcript, highlighted sentence, and controls |

### Chunking and language

Content is split at sentence boundaries. Each chunk gets a detected language, and the engine selects a voice:

- English preferences include Daniel, Samantha, Karen, Google, Natural, Premium, Enhanced.
- Chinese preferences include Meijia, Mei-Jia, Sin-ji, Ting-Ting, Yu-shu, Yu-Shu.

Voice availability is platform-dependent. Browsers expose different lists; the app falls back to the default voice.

### Progress

Progress is stored twice for different reasons:

1. **localStorage** — synchronous read, because Safari blocks speech that is not started inside the user gesture.
2. **IndexedDB (`metadata`)** — backup and source for background sync.

The key format is `tts_progress_{contentKey}`; `contentKey` is typically `{entityName}_{recordId}`. A background sync merges local and remote progress records last-write-wins and writes the merged result to both sides.

### Playlist navigation

Starting TTS from Explore or Bookmarks registers the current list as a playlist, so Previous/Next work inside the transcript sheet.

---

## 4. IndexedDB

Database: **`cms-stash`**, version **4** (`src/db/database.ts`).

| Store | Key | Purpose |
|---|---|---|
| `content` | `id` | Legacy content cache; kept for schema compatibility |
| `sync-queue` | auto-increment | Reserved queue store; current sync services call APIs directly |
| `metadata` | `key` | TTS progress, sync timestamps, settings |
| `offline-files` | `id` | Local media metadata (`addedAt` index) |
| `bookmarks` | `id` | Cached bookmark records (`updatedAt` index) |
| `bookmark-folders` | `id` | Cached folder structure |
| `file-notes` | `id` | Notes per offline file (`fileId`, `createdAt` indexes) |

Adding a store requires a version bump and an `upgrade` branch. Do not assume the schema is stable across releases.

---

## 5. Sync behavior

`SyncManager` runs:

- on mount,
- whenever connectivity returns,
- every 5 minutes while online.

It calls three services:

| Service | Direction | Conflict rule |
|---|---|---|
| `syncBookmarksStore` | CMS → local | Remote is authoritative; bookmarks and folders are replaced |
| `syncProgressStore` | Bidirectional | Last-write-wins per key using timestamps |
| `syncOfflineFilesStore` | Bidirectional | Last-write-wins on `playProgress`/`updatedAt` |

Sync is skipped when no user is logged in. `StatusBar` shows syncing, last sync time, or an error.

The `sync-queue` store exists but is not used by these services; there is no offline mutation replay queue yet.

---

## 6. PWA configuration

From `packages/stash/vite.config.ts`:

- `registerType: 'autoUpdate'`
- scope and start URL `/stash/`
- standalone display, white theme/background
- icons 192/512, plus maskable variants
- Workbox precache for `js`, `css`, `html`, `ico`, `png`, `svg`, `json`, `wasm`
- runtime `NetworkFirst` cache for `https://api.*/*` with a 5-day, 200-entry limit

The service worker is **disabled in dev** (`devOptions.enabled: false`). Test offline behavior with `npm run build:stash && npm run preview:stash`, or through the built image.

The runtime cache pattern matches `https://api.*`, which will not match same-origin `/api` requests. Treat offline API caching as limited; bookmarks and progress work because they are stored in IndexedDB.

---

## 7. Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 + Vite 5 + TypeScript |
| Styling | Tailwind CSS 4, custom sage/zen visual language |
| Animation | Framer Motion |
| Storage | `idb` |
| Speech | Web Speech API (`speechSynthesis`) |
| Icons | Lucide React |
| CMS access | `@cms/sdk`, `@cms/shared`, direct `/api` fetches |
| PWA | `vite-plugin-pwa`, Workbox |

There is no SWR dependency in Stash despite older documentation claiming it.

---

## 8. Running and installing

```bash
npm run dev:stash       # http://127.0.0.1:5176/stash/
npm run build:stash
npm run preview:stash
```

In production the service serves `packages/stash/dist` at `/stash/`.

To install:

1. Open `/stash/` on the device.
2. Use **Add to Home Screen** (Safari) or **Install app** (Chrome).
3. Launch from the icon; it opens in standalone mode.

HTTPS is required for service workers and several browser APIs outside localhost.

---

## 9. Known limitations

- iOS Safari may evict cached files and requires re-selecting local files after the app closes.
- TTS voice quality and availability depend on the OS/browser; there is no server-side TTS.
- Bookmark sync replaces local bookmarks with the server copy; offline edits made directly in IndexedDB are not uploaded.
- The Workbox runtime cache pattern does not cover same-origin `/api`.
- Media conversion depends on the CMS conversion endpoints and ffmpeg in the deployment.
- There is no automated test suite for Stash.

---

## 10. Related pages

- [Page Templates & Interactivity](./Page-Templates-Interactivity.md) — browser SDK used by Stash-adjacent pages
- [Engagement Features](./Engagement-Features.md) — bookmark endpoints
- [API Reference](./API-Reference.md) — CMS endpoints
- [Setup](./Setup.md) — dev ports and proxies
