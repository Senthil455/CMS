export interface SyncStatus {
  lastSyncTime: number | null
  isSyncing: boolean
  error: string | null
}

export interface OfflineState {
  isOnline: boolean
  syncStatus: SyncStatus
}

export interface FileNote {
  id: string          // uuid
  fileId: string      // OfflineFile.id
  position: number    // playback position in seconds at time of note
  desc: string        // note text
  createdAt: string   // ISO timestamp
}

export interface OfflineFile {
  id: string
  filename: string
  title: string
  type: string
  size: number
  addedAt: string
  updatedAt: string         // updated whenever notes or metadata change
  playProgress: number // in seconds
  fileHandle?: any // FileSystemFileHandle for desktop
  serverId?: number // remote record id after sync
  serverUpdatedAt?: string // remote updatedAt for optimistic concurrency
}

export interface RemoteOfflineFile {
  id: number;
  fileId: string;
  filename: string;
  title: string;
  type: string;
  size: number;
  addedAt: string;
  playProgress: number | null;
  fileMetadata?: string;
  publicationStatus: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface BookmarkItem {
  id: number
  updatedAt: string
  image: string
  title: string
  subtitle: string
  publishedAt: string
  url: string
  entityName?: string
  recordId?: string
  content?: string
  folderId?: number
}

export interface BookmarkFolder {
  id: number
  name: string
  description: string
  userId?: string
}

export interface SaveBookmarkPayload {
  selectedFolders: string[];
  newFolderName: string;
}

export interface TopListItem {
  recordId?: string;
  __record_id?: number | string;
  id?: number | string;
  title: string;
  url: string;
  image?: string;
  subtitle?: string;
  content?: string;
  publishedAt: string;
  entityName?: string;
}
