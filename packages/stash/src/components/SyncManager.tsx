import React, { useEffect, useState } from 'react'

import { saveContentBatch, setMetadata } from '@/utils/storage'
import { fetchContentList } from '@/utils/api'

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
        const contents = await fetchContentList()
        await saveContentBatch(contents)
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
