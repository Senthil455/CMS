export interface Content {
  id: string
  title: string
  slug: string
  content: string
  html?: string
  metadata?: Record<string, any>
  createdAt?: string
  updatedAt?: string
  status?: 'draft' | 'published'
  entityName?: string
  type?: 'video' | 'mp3' | 'article'
}

export interface SyncStatus {
  lastSyncTime: number | null
  isSyncing: boolean
  error: string | null
}

export interface OfflineState {
  isOnline: boolean
  syncStatus: SyncStatus
}

export interface CacheConfig {
  maxItems?: number
  ttl?: number // time to live in milliseconds
}
