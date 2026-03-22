export interface SyncStatus {
  lastSyncTime: number | null
  isSyncing: boolean
  error: string | null
}

export interface OfflineState {
  isOnline: boolean
  syncStatus: SyncStatus
}

export interface OfflineFile {
  id: string
  filename: string
  title: string
  type: string
  size: number
  addedAt: string
  playProgress: number // in seconds
  fileHandle?: any // FileSystemFileHandle for desktop
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
