import React, { useEffect, useState } from 'react'
import { Content } from '@/types'
import { getContentStats } from '@/utils/storage'

interface CacheStatsProps {
  content?: Content
}

export const CacheStats: React.FC<CacheStatsProps> = ({ content }) => {
  const [stats, setStats] = useState({
    totalItems: 0,
    cacheSize: 0,
    lastSyncTime: null as number | null,
  })

  useEffect(() => {
    const loadStats = async () => {
      const data = await getContentStats()
      setStats(data)
    }

    loadStats()
  }, [content])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        fontSize: '12px',
        color: '#666',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <strong>Cache Stats:</strong>
      </div>
      <div>📦 Items: {stats.totalItems}</div>
      <div>💾 Size: {formatBytes(stats.cacheSize)}</div>
      {stats.lastSyncTime && (
        <div>🔄 Last sync: {new Date(stats.lastSyncTime).toLocaleTimeString()}</div>
      )}
    </div>
  )
}
