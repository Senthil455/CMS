import { apiFetchJson, apiBaseUrl } from './client';
import type { TopListItem } from '@/types';

/** SWR-compatible fetcher */
export const fetcher = (url: string) => fetch(url).then(res => res.json());

export const exploreApi = {
  fetchQueryResults: (queryName: string) =>
    apiFetchJson<TopListItem[]>(`/api/queries/${queryName}?normalizeTagFields=true`),

  fetchPublicQueries: () =>
    apiFetchJson<string[]>(`/api/schemas/public-queries`),

  fetchContentDetail: (entityName: string, recordId: string) =>
    apiFetchJson<any[]>(`/api/queries/contentTag?entityName=${entityName}&recordId=${recordId}`),

  /** Build the full URL for use with useSWR */
  queryUrl: (queryName: string) =>
    `${apiBaseUrl}/api/queries/${queryName}?normalizeTagFields=true`,
};
