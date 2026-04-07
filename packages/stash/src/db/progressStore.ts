import { initializeDB, METADATA_STORE_NAME } from './database'

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await initializeDB()
  await db.put(METADATA_STORE_NAME, { key, value, timestamp: Date.now() })
}

export async function getMetadata(key: string): Promise<any> {
  const db = await initializeDB()
  const item = await db.get(METADATA_STORE_NAME, key)
  return item?.value
}

export async function getAllMetadataByPrefix(prefix: string): Promise<{ key: string; value: any; timestamp: number }[]> {
  const db = await initializeDB()
  const all = await db.getAll(METADATA_STORE_NAME)
  return all.filter(item => item.key.startsWith(prefix))
}
