import { apiFetchJson } from './client';

export const offlineFileApi = {
  fetchOfflineFiles: (userId: string) =>
    apiFetchJson<{ items: any[]; totalRecords: number }>(
      `/api/entities/offlineFile?offset=0&limit=500&sort[id]=-1&createdBy[equals]=${userId}`
    ),

  insertOfflineFile: (file: {
    fileId: string;
    filename: string;
    title: string;
    type: string;
    size: number;
    addedAt: string;
    playProgress: number;
    fileMetadata?: string; // JSON.stringify({ notes: FileNote[] })
  }) =>
    apiFetchJson<any>(`/api/entities/offlineFile/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...file,
        publicationStatus: 'published',
        publishedAt: new Date().toISOString(),
      }),
    }),

  updateOfflineFile: (record: {
    id: number;
    fileId: string;
    filename: string;
    title: string;
    type: string;
    size: number;
    addedAt: string;
    playProgress: number;
    fileMetadata?: string; // JSON.stringify({ notes: FileNote[] })
    updatedAt: string;
  }) =>
    apiFetchJson<any>(`/api/entities/offlineFile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...record,
        publicationStatus: 'published',
      }),
    }),
};
