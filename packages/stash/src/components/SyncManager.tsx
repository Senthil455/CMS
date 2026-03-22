import React, { useEffect, useState } from 'react'

import { setMetadata, clearBookmarks, clearBookmarkFolders, saveBookmarks, saveBookmarkFolders, getAllBookmarks } from '@/utils/storage'
import { engagementApi } from '@/utils/engagementApi'

export const syncBookmarksStore = async () => {
  try {
    // Sync Bookmark Folders
    const foldersRes = await engagementApi.fetchAllBookmarkFolders()
    await clearBookmarkFolders()
    await saveBookmarkFolders(foldersRes)

    // Ensure we also sync folder 0 (Default)
    const allFolderIds = [0, ...foldersRes.map((f: any) => f.id)]
    
    // Pre-load existing bookmarks to preserve local HTML content across syncs based on publishedAt
    const existingBookmarks = await getAllBookmarks()
    const existingBookmarksMap = new Map()
    existingBookmarks.forEach(b => existingBookmarksMap.set(b.id, b))
    
    let allBookmarks: any[] = []

    for (const folderId of allFolderIds) {
      const listRes = await engagementApi.fetchBookmarkList(folderId, 0, 100)
      const items = listRes.items || []
      
      // Assign folderId to each item
      items.forEach(item => item.folderId = folderId)
      
      const itemsToFetchContent: any[] = []
      
      // Compare with local items to see if we can skip the heavy contentTag payload
      items.forEach(item => {
        const parts = item.url?.split('/').filter(Boolean) || []
        if (parts.length >= 2) {
           item.entityName = parts[0];
           item.recordId = parts[1];
        }

        const existing = existingBookmarksMap.get(item.id)
        if (existing && existing.content && existing.publishedAt === item.publishedAt) {
          item.content = existing.content
          item.entityName = existing.entityName
          item.recordId = existing.recordId
        } else {
          itemsToFetchContent.push(item)
        }
      })
      
      // Fetch full content for bookmarks (group by entity from URL)
      const itemsByEntity: Record<string, any[]> = {}
      itemsToFetchContent.forEach(item => {
        const parts = item.url?.split('/').filter(Boolean) || []
        if (parts.length >= 2) {
          const entityName = parts[0]
          if (!itemsByEntity[entityName]) itemsByEntity[entityName] = []
          itemsByEntity[entityName].push(item)
        }
      })

      for (const [entityName, entityItems] of Object.entries(itemsByEntity)) {
        const recordIds = entityItems.map(item => {
          const parts = item.url.split('/').filter(Boolean)
          return Number(parts[1])
        }).filter(id => !isNaN(id))

        if (recordIds.length > 0) {
          try {
            const contentTags = await engagementApi.fetchContentTagBatch(entityName, recordIds)
            const contentMap = new Map()
            contentTags.forEach((ct: any) => contentMap.set(ct.recordId.toString(), ct))

            entityItems.forEach(item => {
              const parts = item.url.split('/').filter(Boolean)
              const recordId = parts[1]
              const tagData = contentMap.get(recordId)
              if (tagData && tagData.content) {
                item.content = tagData.content
                item.entityName = entityName
                item.recordId = recordId
              }
            })
          } catch (e) {
            console.warn(`Failed to fetch content tags for ${entityName}`, e)
          }
        }
      }
      
      allBookmarks = [...allBookmarks, ...items]
    }

    await clearBookmarks()
    await saveBookmarks(allBookmarks)
    await setMetadata('lastBookmarkSyncTime', Date.now())
  } catch (e) {
    console.warn('Bookmark sync neglected/failed:', e)
  }
}

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
        await syncBookmarksStore()
        
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
