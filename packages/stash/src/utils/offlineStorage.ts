import { initializeDB, OFFLINE_STORE_NAME } from './storage'
import { OfflineFile } from '@/types'

export async function saveOfflineFile(file: OfflineFile): Promise<void> {
  const db = await initializeDB()
  const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite')
  
  // Strip non-serializable or large data before saving to IDB
  // We only want to persist metadata and progress
  const { fileData, fileHandle, ...metadata } = file
  
  await tx.store.put({
    ...metadata,
    addedAt: metadata.addedAt || new Date().toISOString(),
  })
  await tx.done
}

export async function getAllOfflineFiles(): Promise<OfflineFile[]> {
  const db = await initializeDB()
  return db.getAll(OFFLINE_STORE_NAME)
}

export async function getOfflineFile(id: string): Promise<OfflineFile | undefined> {
  const db = await initializeDB()
  return db.get(OFFLINE_STORE_NAME, id)
}

export async function updateOfflineFileProgress(id: string, progress: number): Promise<void> {
  const db = await initializeDB()
  const file = await db.get(OFFLINE_STORE_NAME, id)
  if (file) {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite')
    // Ensure we don't accidentally save fileData/fileHandle if they were somehow in the retrieved object
    const { fileData, fileHandle, ...metadata } = file
    await tx.store.put({
      ...metadata,
      playProgress: progress,
    })
    await tx.done
  }
}

export async function deleteOfflineFile(id: string): Promise<void> {
  const db = await initializeDB()
  await db.delete(OFFLINE_STORE_NAME, id)
}
