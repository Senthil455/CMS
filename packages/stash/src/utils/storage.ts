import { IDBPDatabase, openDB } from 'idb'
import { Content } from '@/types'

const DB_NAME = 'cms-stash'
const STORE_NAME = 'content'
const SYNC_STORE_NAME = 'sync-queue'
export const METADATA_STORE_NAME = 'metadata'
export const OFFLINE_STORE_NAME = 'offline-files'
export const BOOKMARKS_STORE_NAME = 'bookmarks'
export const BOOKMARK_FOLDERS_STORE_NAME = 'bookmark-folders'
const DB_VERSION = 3 // Incremented version to trigger upgrade

let db: IDBPDatabase | null = null

export async function initializeDB(): Promise<IDBPDatabase> {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Content store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('slug', 'slug', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }

      // Metadata store
      if (!db.objectStoreNames.contains(METADATA_STORE_NAME)) {
        db.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' })
      }

      // Offline files store
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        const store = db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' })
        store.createIndex('addedAt', 'addedAt', { unique: false })
      }

      // Bookmarks store
      if (!db.objectStoreNames.contains(BOOKMARKS_STORE_NAME)) {
        const store = db.createObjectStore(BOOKMARKS_STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Bookmark folders store
      if (!db.objectStoreNames.contains(BOOKMARK_FOLDERS_STORE_NAME)) {
        db.createObjectStore(BOOKMARK_FOLDERS_STORE_NAME, { keyPath: 'id' })
      }
    },
  })

  return db
}

export async function saveContent(content: Content): Promise<void> {
  if (!db) await initializeDB()
  const tx = db!.transaction(STORE_NAME, 'readwrite')
  await tx.store.put({
    ...content,
    updatedAt: new Date().toISOString(),
  })
  await tx.done
}

export async function saveContentBatch(contents: Content[]): Promise<void> {
  if (!db) await initializeDB()
  const tx = db!.transaction(STORE_NAME, 'readwrite')
  for (const content of contents) {
    await tx.store.put({
      ...content,
      updatedAt: new Date().toISOString(),
    })
  }
  await tx.done
}

export async function getContent(id: string): Promise<Content | undefined> {
  if (!db) await initializeDB()
  return db!.get(STORE_NAME, id)
}

export async function getAllContent(): Promise<Content[]> {
  if (!db) await initializeDB()
  return db!.getAll(STORE_NAME)
}

export async function getContentBySlug(slug: string): Promise<Content | undefined> {
  if (!db) await initializeDB()
  return db!.getFromIndex(STORE_NAME, 'slug', slug)
}

export async function searchContent(query: string): Promise<Content[]> {
  if (!db) await initializeDB()
  const allContent = await db!.getAll(STORE_NAME)
  const lowerQuery = query.toLowerCase()

  return allContent.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      item.slug.toLowerCase().includes(lowerQuery)
  )
}

export async function deleteContent(id: string): Promise<void> {
  if (!db) await initializeDB()
  await db!.delete(STORE_NAME, id)
}

export async function clearAllContent(): Promise<void> {
  if (!db) await initializeDB()
  await db!.clear(STORE_NAME)
}

export async function addSyncQueueItem(
  action: 'create' | 'update' | 'delete',
  contentId: string,
  data?: Partial<Content>
): Promise<void> {
  if (!db) await initializeDB()
  await db!.add(SYNC_STORE_NAME, {
    action,
    contentId,
    data,
    timestamp: Date.now(),
  })
}

export async function getSyncQueue(): Promise<any[]> {
  if (!db) await initializeDB()
  return db!.getAll(SYNC_STORE_NAME)
}

export async function clearSyncQueue(): Promise<void> {
  if (!db) await initializeDB()
  await db!.clear(SYNC_STORE_NAME)
}

export async function setMetadata(key: string, value: any): Promise<void> {
  if (!db) await initializeDB()
  await db!.put(METADATA_STORE_NAME, { key, value, timestamp: Date.now() })
}

export async function getMetadata(key: string): Promise<any> {
  if (!db) await initializeDB()
  const item = await db!.get(METADATA_STORE_NAME, key)
  return item?.value
}

export async function getContentStats(): Promise<{
  totalItems: number
  lastSyncTime: number | null
  cacheSize: number
}> {
  if (!db) await initializeDB()

  const totalItems = await db!.count(STORE_NAME)
  const lastSyncTime = await getMetadata('lastSyncTime')
  const allContent = await db!.getAll(STORE_NAME)

  const cacheSize = JSON.stringify(allContent).length

  return {
    totalItems,
    lastSyncTime: lastSyncTime || null,
    cacheSize,
  }
}

// Bookmark CRUD functions
export async function saveBookmarks(items: any[]): Promise<void> {
  if (!db) await initializeDB()
  const tx = db!.transaction(BOOKMARKS_STORE_NAME, 'readwrite')
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export async function getAllBookmarks(): Promise<any[]> {
  if (!db) await initializeDB()
  const items = await db!.getAll(BOOKMARKS_STORE_NAME)
  // Sort descending by id
  return items.sort((a, b) => b.id - a.id)
}

export async function clearBookmarks(): Promise<void> {
  if (!db) await initializeDB()
  await db!.clear(BOOKMARKS_STORE_NAME)
}

export async function saveBookmarkFolders(folders: any[]): Promise<void> {
  if (!db) await initializeDB()
  const tx = db!.transaction(BOOKMARK_FOLDERS_STORE_NAME, 'readwrite')
  for (const folder of folders) {
    await tx.store.put(folder)
  }
  await tx.done
}

export async function getAllBookmarkFolders(): Promise<any[]> {
  if (!db) await initializeDB()
  return db!.getAll(BOOKMARK_FOLDERS_STORE_NAME)
}

export async function clearBookmarkFolders(): Promise<void> {
  if (!db) await initializeDB()
  await db!.clear(BOOKMARK_FOLDERS_STORE_NAME)
}
