import { getAllMetadataByPrefix, setMetadata, getMetadata } from '@/db/progressStore';
import { progressApi } from '@/api/progressApi';

export async function syncProgressStore(userId: string): Promise<void> {
  // ── 1. Read all local tts_progress_* entries from IndexedDB ──
  const localEntries = await getAllMetadataByPrefix('tts_progress_');
  // Shape: { key, value: { offset, timestamp }, timestamp }

  // ── 2. Fetch the remote progress record for this user ──
  const res = await progressApi.fetchProgressRecords(userId);
  const remoteRecord = res.items?.[0]; // may be undefined

  const lastSyncUpdatedAt = await getMetadata('lastProgressSyncUpdatedAt');
  if (remoteRecord && remoteRecord.updatedAt === lastSyncUpdatedAt) {
    // Optimization: nothing changed locally or remotely since last sync!
    return;
  }

  let remoteEntries: { key: string; value: { offset: number; timestamp: number }; timestamp: number }[] = [];

  if (remoteRecord) {
    try {
      remoteEntries = JSON.parse(remoteRecord.progress);
      if (!Array.isArray(remoteEntries)) remoteEntries = [];
    } catch {
      remoteEntries = [];
    }
  }

  // ── 3. Merge: last-write-wins per key ──
  const merged = new Map<string, { key: string; value: any; timestamp: number }>();

  // Seed with remote
  for (const entry of remoteEntries) {
    merged.set(entry.key, entry);
  }

  // Override with local where local is newer
  for (const entry of localEntries) {
    const existing = merged.get(entry.key);
    if (!existing || entry.timestamp > existing.timestamp) {
      merged.set(entry.key, entry);
    }
  }

  const mergedArray = Array.from(merged.values());
  const mergedJson = JSON.stringify(mergedArray);

  // ── 4. Write merged result back to REMOTE ──
  let response: any;
  if (remoteRecord) {
    response = await progressApi.updateProgress(remoteRecord.id, mergedJson, remoteRecord.updatedAt);
  } else {
    response = await progressApi.insertProgress(mergedJson);
  }

  if (response && response.updatedAt) {
    await setMetadata('lastProgressSyncUpdatedAt', response.updatedAt);
  }

  // ── 5. Write merged result back to LOCAL (IndexedDB + localStorage) ──
  for (const entry of mergedArray) {
    // IndexedDB
    await setMetadata(entry.key, entry.value);
    // localStorage (so loadProgress() picks it up immediately)
    try {
      localStorage.setItem(entry.key, JSON.stringify(entry.value));
    } catch (e) {
      console.warn('Failed to write merged progress to localStorage:', e);
    }
  }
}
