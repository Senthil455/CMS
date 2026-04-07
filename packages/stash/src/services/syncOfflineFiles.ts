import { getAllOfflineFiles, saveOfflineFile } from '@/db/offlineFileStore';
import { offlineFileApi } from '@/api/offlineFileApi';
import { OfflineFile } from '@/types';

/**
 * Sync local IndexedDB offline-file metadata with the remote offlineFile entity.
 *
 * Strategy — per fileId (the local UUID):
 *   • exists locally only     → INSERT to server, store serverId back locally
 *   • exists remotely only    → save to local IndexedDB (downloaded elsewhere)
 *   • exists both             → last-write-wins on playProgress; UPDATE server
 */
export async function syncOfflineFilesStore(userId: string): Promise<void> {
  // ── 1. Read all local offline files from IndexedDB ──
  const localFiles = await getAllOfflineFiles();

  // ── 2. Fetch remote records for this user ──
  const res = await offlineFileApi.fetchOfflineFiles(userId);
  const remoteRecords: any[] = res.items ?? [];

  // Build lookup: fileId → remote record
  const remoteByFileId = new Map<string, any>();
  for (const r of remoteRecords) {
    if (r.fileId) remoteByFileId.set(r.fileId, r);
  }

  // Build lookup: fileId (== id) → local file
  const localById = new Map<string, OfflineFile>();
  for (const f of localFiles) {
    localById.set(f.id, f);
  }

  // ── 3. Process local files ──
  for (const local of localFiles) {
    const remote = remoteByFileId.get(local.id);

    if (!remote) {
      // Local-only → INSERT to server
      const result = await offlineFileApi.insertOfflineFile({
        fileId: local.id,
        filename: local.filename,
        title: local.title,
        type: local.type,
        size: local.size,
        addedAt: local.addedAt,
        playProgress: local.playProgress,
        fileMetadata: local.fileMetadata ?? '',
      });

      // Persist serverId back so future syncs can UPDATE
      if (result?.id) {
        await saveOfflineFile({
          ...local,
          serverId: result.id,
          serverUpdatedAt: result.updatedAt ?? new Date().toISOString(),
        });
      }
    } else {
      // Exists on both sides — merge (last-write-wins on playProgress)
      const localTs = new Date(local.addedAt).getTime();
      const remoteTs = new Date(remote.addedAt).getTime();
      const mergedProgress =
        local.playProgress >= remote.playProgress
          ? local.playProgress
          : remote.playProgress;

      // UPDATE server with merged data
      await offlineFileApi.updateOfflineFile({
        id: remote.id,
        fileId: local.id,
        filename: local.filename,
        title: local.title,
        type: local.type,
        size: local.size,
        addedAt: local.addedAt,
        playProgress: mergedProgress,
        fileMetadata: local.fileMetadata ?? remote.fileMetadata ?? '',
        updatedAt: remote.updatedAt,
      });

      // Update local with merged progress + serverId
      await saveOfflineFile({
        ...local,
        playProgress: mergedProgress,
        serverId: remote.id,
        serverUpdatedAt: remote.updatedAt,
      });

      // Remove from remote map so step 4 doesn't re-process
      remoteByFileId.delete(local.id);
    }
  }

  // ── 4. Remote-only records → save to local IndexedDB ──
  for (const [fileId, remote] of remoteByFileId) {
    // Skip if we already have it locally (shouldn't happen after step 3)
    if (localById.has(fileId)) continue;

    const newLocal: OfflineFile = {
      id: fileId,
      filename: remote.filename ?? '',
      title: remote.title ?? '',
      type: remote.type ?? '',
      size: remote.size ?? 0,
      addedAt: remote.addedAt ?? new Date().toISOString(),
      playProgress: remote.playProgress ?? 0,
      fileMetadata: remote.fileMetadata ?? '',
      serverId: remote.id,
      serverUpdatedAt: remote.updatedAt,
    };

    await saveOfflineFile(newLocal);
  }
}
