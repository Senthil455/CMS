import React, { useEffect, useState } from 'react'
import { syncBookmarksStore } from '@/services/syncBookmarks'
import { syncProgressStore } from '@/services/syncProgress'
import { syncOfflineFilesStore } from '@/services/syncOfflineFiles'
import { setMetadata } from '@/db/progressStore'

interface SyncManagerProps {
  isOnline: boolean
  userId?: string
  onSyncStart?: () => void
  onSyncEnd?: (success: boolean, error?: string) => void
}

export const SyncManager: React.FC<SyncManagerProps> = ({ isOnline, userId, onSyncStart, onSyncEnd }) => {
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!isOnline || isSyncing) return

    const sync = async () => {
      setIsSyncing(true)
      onSyncStart?.()

      try {
        await syncBookmarksStore()
        if (userId) {
          await syncProgressStore(userId)
          await syncOfflineFilesStore(userId)
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
