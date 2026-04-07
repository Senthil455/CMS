import { initializeDB, BOOKMARKS_STORE_NAME, BOOKMARK_FOLDERS_STORE_NAME } from './database'

export async function saveBookmarks(items: any[]): Promise<void> {
  const db = await initializeDB()
  const tx = db.transaction(BOOKMARKS_STORE_NAME, 'readwrite')
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export async function getAllBookmarks(): Promise<any[]> {
  const db = await initializeDB()
  const items = await db.getAll(BOOKMARKS_STORE_NAME)
  // Sort descending by id
  return items.sort((a, b) => b.id - a.id)
}

export async function clearBookmarks(): Promise<void> {
  const db = await initializeDB()
  await db.clear(BOOKMARKS_STORE_NAME)
}

export async function saveBookmarkFolders(folders: any[]): Promise<void> {
  const db = await initializeDB()
  const tx = db.transaction(BOOKMARK_FOLDERS_STORE_NAME, 'readwrite')
  for (const folder of folders) {
    await tx.store.put(folder)
  }
  await tx.done
}

export async function getAllBookmarkFolders(): Promise<any[]> {
  const db = await initializeDB()
  return db.getAll(BOOKMARK_FOLDERS_STORE_NAME)
}

export async function clearBookmarkFolders(): Promise<void> {
  const db = await initializeDB()
  await db.clear(BOOKMARK_FOLDERS_STORE_NAME)
}
