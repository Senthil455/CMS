import React, { useEffect, useState } from 'react'

import { setMetadata, clearBookmarks, clearBookmarkFolders, saveBookmarks, saveBookmarkFolders } from '@/utils/storage'
import { engagementApi } from '@/utils/engagementApi'

interface SyncManagerProps {
  isOnline: boolean
  onSyncStart?: () => void
  onSyncEnd?: (success: boolean, error?: string) => void
}

export const SyncManager: React.FC<SyncManagerProps> = ({ isOnline, onSyncStart, onSyncEnd }) => {
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!isOnline || isSyncing) return

    const sync = async () => {
      setIsSyncing(true)
      onSyncStart?.()

      try {
        try {
          // Sync Bookmark Folders
          const folders = await engagementApi.fetchAllBookmarkFolders()
          await clearBookmarkFolders()
          await saveBookmarkFolders(folders)

          // Sync Bookmarks (limit 100 for now)
          const listRes = await engagementApi.fetchBookmarkList(0, 0, 100)
          await clearBookmarks()
          await saveBookmarks(listRes.items || [])

          await setMetadata('lastBookmarkSyncTime', Date.now())
        } catch (e) {
          console.warn('Bookmark sync neglected/failed:', e)
        }
        
        await setMetadata('lastSyncTime', Date.now())
        onSyncEnd?.(true)
      } catch (error) {
        console.error('Sync failed:', error)
        onSyncEnd?.(false, error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsSyncing(false)
      }
    }

    // Initial sync
    sync()

    // Periodic sync every 5 minutes
    const interval = setInterval(sync, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isOnline, onSyncStart, onSyncEnd])

  return null
}
