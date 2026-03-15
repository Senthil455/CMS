import React from 'react'
import { OfflineState } from '@/types'

interface StatusBarProps {
  offlineState: OfflineState
}

export const StatusBar: React.FC<StatusBarProps> = ({ offlineState }) => {
  if (offlineState.isOnline && !offlineState.syncStatus.isSyncing) {
    return null
  }

  return (
    <div
      style={{
        padding: '8px 16px',
        backgroundColor: offlineState.isOnline ? 'rgba(109, 166, 122, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(106, 135, 115, 0.1)',
        color: offlineState.isOnline ? 'var(--sage-dark)' : '#ef4444',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!offlineState.isOnline && <span>📡 Offline</span>}
        {offlineState.isOnline && offlineState.syncStatus.isSyncing && (
          <span className="animate-spin">🔄</span>
        )}
        {offlineState.isOnline && offlineState.syncStatus.isSyncing && (
          <span>Updating Content...</span>
        )}
        {offlineState.syncStatus.error && <span>⚠️ {offlineState.syncStatus.error}</span>}
      </div>
      {offlineState.syncStatus.lastSyncTime && (
        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
          Synced at {new Date(offlineState.syncStatus.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}
