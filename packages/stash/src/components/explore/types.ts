export interface TopListItem {
  recordId?: string;
  __record_id?: number | string;
  id?: number | string;
  title: string;
  url: string;
  image?: string;
  subtitle?: string;
  content?: string;
  publishedAt: string;
  entityName?: string;
}

export const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_URL ?? import.meta.env.VITE_APP_API_URL ?? '';

export const fetcher = (url: string) => fetch(url).then(res => res.json());

export function tabLabel(id: string) {
  if (id === 'topList') return 'Top List';
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}
