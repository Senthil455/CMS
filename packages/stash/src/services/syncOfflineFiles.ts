import { getAllOfflineFiles, saveOfflineFile } from '@/db/offlineFileStore';
import { getFileNotes, saveFileNotes, clearFileNotes } from '@/db/fileNoteStore';
import { offlineFileApi } from '@/api/offlineFileApi';
import { OfflineFile, RemoteOfflineFile } from '@/types';

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
  const remoteRecords: RemoteOfflineFile[] = res.items ?? [];

  // Build lookup: fileId → remote record
  const remoteByFileId = new Map<string, RemoteOfflineFile>();
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
      const notes = await getFileNotes(local.id);
      const fileMetadata = JSON.stringify({ notes });
      const result = await offlineFileApi.insertOfflineFile({
        fileId: local.id,
        filename: local.filename,
        title: local.title,
        type: local.type,
        size: local.size,
        addedAt: local.addedAt,
        playProgress: local.playProgress,
        fileMetadata,
      });

      // Persist serverId back so future syncs can UPDATE
      if (result?.id) {
        await saveOfflineFile({
          ...local,
          serverId: result.id,
          // Update local updatedAt to remote updatedAt, so next sync will not overwrite remote
          // update at means the last time the file was updated or synced
          updatedAt: result.updatedAt ?? new Date().toISOString(),
        });
      }
    } else {
      // Exists on both sides — use updatedAt to decide sync direction
      const localTs = new Date(local.updatedAt).getTime();
      const remoteTs = new Date(remote.updatedAt).getTime();

      if (localTs === remoteTs) {
        // In sync
        remoteByFileId.delete(local.id);
        continue;
      }

      if (localTs > remoteTs) {
        // Local is newer → push to remote
        const notes = await getFileNotes(local.id);
        const fileMetadata = JSON.stringify({ notes });

        var remoteResult = await offlineFileApi.updateOfflineFile({
          id: remote.id,
          fileId: local.id,
          filename: local.filename,
          title: local.title,
          type: local.type,
          size: local.size,
          addedAt: local.addedAt,
          playProgress: local.playProgress,
          fileMetadata,
          updatedAt: remote.updatedAt, // Pass current remote updatedAt for optimistic locking
        });

        // Update local updatedAt to remote updatedAt, so next sync will not overwrite remote
        // update at means the last time the file was updated or synced
        await saveOfflineFile({
          ...local,
          serverId: remote.id,
          updatedAt: remoteResult.updatedAt,
        });

      } else {
        // Remote is newer → pull to local
        await saveOfflineFile({
          ...local,
          filename: remote.filename ?? local.filename,
          title: remote.title ?? local.title,
          type: remote.type ?? local.type,
          size: remote.size ?? local.size,
          addedAt: remote.addedAt ?? local.addedAt,
          updatedAt: remote.updatedAt,
          playProgress: remote.playProgress ?? local.playProgress,
          serverId: remote.id,
        });

        if (remote.fileMetadata) {
          try {
            const meta = JSON.parse(remote.fileMetadata);
            if (Array.isArray(meta.notes)) {
              await clearFileNotes(local.id);
              if (meta.notes.length > 0) {
                await saveFileNotes(meta.notes);
              }
            }
          } catch (e) {
            console.warn(`Failed to parse fileMetadata for remote file ${local.id}`, e);
          }
        }
      }

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
      updatedAt: remote.updatedAt,
      playProgress: remote.playProgress ?? 0,
      serverId: remote.id,
    };

    await saveOfflineFile(newLocal);

    // Sync notes from metadata if present
    if (remote.fileMetadata) {
      try {
        const meta = JSON.parse(remote.fileMetadata);
        if (Array.isArray(meta.notes) && meta.notes.length > 0) {
          await saveFileNotes(meta.notes);
        }
      } catch (e) {
        console.warn(`Failed to parse fileMetadata for remote file ${fileId}`, e);
      }
    }
  }
}
