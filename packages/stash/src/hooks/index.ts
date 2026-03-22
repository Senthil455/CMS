import { useEffect, useState } from 'react'
import { OfflineState, SyncStatus } from '@/types'

export function useOnlineStatus(): OfflineState {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncStatus: {
      lastSyncTime: null,
      isSyncing: false,
      error: null,
    },
  })

  useEffect(() => {
    const handleOnline = () => {
      setOfflineState((prev) => ({
        ...prev,
        isOnline: true,
        syncStatus: {
          ...prev.syncStatus,
          error: null,
        },
      }))
    }

    const handleOffline = () => {
      setOfflineState((prev) => ({
        ...prev,
        isOnline: false,
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return offlineState
}

export function useSyncStatus(): SyncStatus {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    isSyncing: false,
    error: null,
  })

  useEffect(() => {
    const checkSyncStatus = async () => {
      // This will be updated by the sync manager
      const stored = localStorage.getItem('cms-sync-status')
      if (stored) {
        setSyncStatus(JSON.parse(stored))
      }
    }

    checkSyncStatus()

    const interval = setInterval(checkSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return syncStatus
}

export * from './useSpeechSynthesis';
