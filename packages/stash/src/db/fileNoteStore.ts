import { initializeDB, FILE_NOTES_STORE_NAME } from './database'
import { FileNote } from '@/types'

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export async function addFileNote(
  fileId: string,
  position: number,
  desc: string
): Promise<FileNote> {
  const db = await initializeDB()
  const note: FileNote = {
    id: newId(),
    fileId,
    position,
    desc,
    createdAt: new Date().toISOString(),
  }
  await db.put(FILE_NOTES_STORE_NAME, note)
  return note
}

export async function getFileNotes(fileId: string): Promise<FileNote[]> {
  const db = await initializeDB()
  const all: FileNote[] = await db.getAllFromIndex(FILE_NOTES_STORE_NAME, 'fileId', fileId)
  // Sort by position ascending
  return all.sort((a, b) => a.position - b.position)
}

export async function updateFileNote(id: string, desc: string): Promise<void> {
  const db = await initializeDB()
  const note = await db.get(FILE_NOTES_STORE_NAME, id)
  if (note) {
    await db.put(FILE_NOTES_STORE_NAME, { ...note, desc })
  }
}

export async function deleteFileNote(id: string): Promise<void> {
  const db = await initializeDB()
  await db.delete(FILE_NOTES_STORE_NAME, id)
}
