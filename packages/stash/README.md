# CMS Stash - Content Viewer

A Progressive Web Application (PWA) for CMS (Stash) that enables users to view and manage content offline.

## Features

- 📱 **Progressive Web App**: Install as an app on desktop and mobile devices
- 🔌 **Offline-First**: Full content access without internet connection
- 💾 **Local Storage**: Content cached using IndexedDB for fast access
- 🔄 **Auto-Sync**: Automatic synchronization when online
- 🔍 **Search**: Full-text search across cached content
- ⚡ **Fast**: Instant content loading from cache
- 📊 **Cache Stats**: View storage usage and sync status

## Installation

### Prerequisites

- Node.js 16+
- pnpm

### Setup

1. Install dependencies:
```bash
cd packages/stash
pnpm install
```

2. Set environment variables:
```bash
# Create a .env file
VITE_APP_API_URL=http://localhost:3000/api
```

3. Start development server:
```bash
pnpm dev
```

4. Build for production:
```bash
pnpm build
```

## Architecture

### Core Components

- **StatusBar**: Shows online/offline status and sync status
- **SearchBar**: Search cached content
- **ContentList**: Display list of cached content
- **ContentViewer**: Display selected content details
- **SyncManager**: Handle online/offline synchronization
- **CacheStats**: Show cache usage information

### Storage

- **IndexedDB**: Primary storage for content data
- **localStorage**: Metadata and sync status

### API Integration

The app expects the CMS API to provide:

- `GET /api/content` - List all content
- `GET /api/content/:id` - Get specific content
- `POST /api/content` - Create new content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content
- `POST /api/content/sync` - Sync changes

## Usage

### Online Mode
1. Launch the app when connected to internet
2. Content automatically syncs to local storage
3. Search and view content normally

### Offline Mode
1. When offline, the app displays cached content
2. Search functionality works on cached data
3. Status bar shows offline indicator
4. When connection returns, changes sync automatically

### Installation on Devices

#### Desktop (Chrome/Edge)
1. Click the install icon in the address bar
2. Click "Install"

#### Mobile (Chrome)
1. Open the app in Chrome
2. Tap the menu icon (three dots)
3. Tap "Install app" or "Add to Home Screen"

#### iOS (Safari)
1. Tap the Share button
2. Tap "Add to Home Screen"

## Configuration

### Environment Variables

```
VITE_APP_API_URL=http://your-api-server/api  # CMS API endpoint
```

### Vite Configuration

Modify `vite.config.ts` to adjust:
- PWA manifest settings
- Cache strategies
- Build options

## Storage Management

The app uses IndexedDB with the following stores:

- **content**: Cached content items
- **sync-queue**: Pending changes
- **metadata**: App metadata (sync times, etc.)

### Cache Size
- Default: Up to 200 items cached
- Typical size: 1-50MB depending on content

## Troubleshooting

### App won't sync
- Check API endpoint in environment variables
- Verify network connectivity
- Check browser console for errors

### Content not updating
- Manual refresh: Reload the page
- Clear cache: Open DevTools → Application → Clear storage
- Check sync status in status bar

### Install not available
- Ensure HTTPS (except localhost)
- Verify manifest.json is valid
- Check browser console for errors

## Development

### Project Structure

```
packages/stash/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   ├── App.css          # Global styles
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Package configuration
```

### Adding New Components

1. Create component in `src/components/`
2. Export from component files
3. Import and use in App or other components

### Adding API Endpoints

1. Update `src/utils/api.ts` with new endpoints
2. Update types in `src/types/index.ts` if needed
3. Use in components as needed

## Performance

- Initial load: < 1s (with cache)
- Search: < 100ms for 1000 items
- Sync: Depends on content size and network

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

## License

Same as CMS

## Support

For issues or feature requests, please open an issue on the CMS repository.
