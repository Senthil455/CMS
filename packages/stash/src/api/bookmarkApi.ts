import { apiFetch, apiFetchJson, apiBaseUrl } from './client';
import type { BookmarkFolder, SaveBookmarkPayload } from '@/types';

/** SWR-compatible fetcher that includes auth headers */
export const authFetcher = (path: string) => apiFetchJson<any>(path);

export const bookmarkApi = {
  saveBookmark: (entity: string, id: string, payload: SaveBookmarkPayload) =>
    apiFetchJson(`/api/bookmarks/${entity}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  fetchFolders: (entity: string, id: string) => {
    // The previous code returned an array of objects shaped like { id: string, name: string, selected?: boolean } for this specific call.
    return apiFetchJson<any[]>(`/api/bookmarks/folders/${entity}/${id}`);
  },

  fetchAllFolders: () => {
    return apiFetchJson<any[]>(`/api/bookmarks/folders`);
  },

  /** SWR key for fetchFolders */
  foldersKey: (entity: string, id: string) => `/api/bookmarks/folders/${entity}/${id}`,

  /** SWR key for fetchAllFolders */
  allFoldersKey: () => `/api/bookmarks/folders`,

  fetchList: (folderId = 0, offset = 0, limit = 100) =>
    apiFetchJson<{ items: any[]; totalRecords: number }>(
      `/api/bookmarks/list/${folderId}?offset=${offset}&limit=${limit}&sort[id]=-1`
    ),

  deleteBookmark: (id: number) =>
    apiFetchJson(`/api/bookmarks/delete/${id}`, { method: 'POST' }),

  fetchContentTagBatch: (entityName: string, recordIds: number[]) => {
    if (recordIds.length === 0) return Promise.resolve([]);
    const params = new URLSearchParams();
    params.append('entityName', entityName);
    recordIds.forEach(id => params.append('recordId', id.toString()));
    return apiFetchJson<any[]>(`/api/queries/contentTag?${params}`);
  },
};
