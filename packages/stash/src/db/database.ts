import { IDBPDatabase, openDB } from 'idb'

export const DB_NAME = 'cms-stash'
export const DB_VERSION = 4

export const METADATA_STORE_NAME = 'metadata'
export const OFFLINE_STORE_NAME = 'offline-files'
export const BOOKMARKS_STORE_NAME = 'bookmarks'
export const BOOKMARK_FOLDERS_STORE_NAME = 'bookmark-folders'
export const FILE_NOTES_STORE_NAME = 'file-notes'

let db: IDBPDatabase | null = null

export async function initializeDB(): Promise<IDBPDatabase> {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Content store (kept for schema compatibility if needed, but unused)
      if (!db.objectStoreNames.contains('content')) {
        const store = db.createObjectStore('content', { keyPath: 'id' })
        store.createIndex('slug', 'slug', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true })
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

      // File notes store
      if (!db.objectStoreNames.contains(FILE_NOTES_STORE_NAME)) {
        const store = db.createObjectStore(FILE_NOTES_STORE_NAME, { keyPath: 'id' })
        store.createIndex('fileId', 'fileId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    },
  })

  return db
}
