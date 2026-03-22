export interface BookmarkFolder {
  id: string;
  name: string;
  selected?: boolean;
}

export interface SaveBookmarkPayload {
  selectedFolders: string[];
  newFolderName: string;
}

const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_URL ?? import.meta.env.VITE_APP_API_URL ?? '';

export const engagementApi = {
  async saveBookmark(entity: string, id: string, payload: SaveBookmarkPayload) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`; // Just in case, standard JWT handling if needed. 
    }
    
    // Using relative path as it's typically handled by Vite proxy or deployed together
    // but applying apiBaseUrl for external backend like topList does
    const response = await fetch(`${apiBaseUrl}/api/bookmarks/${entity}/${id}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error('Failed to save bookmark');
    
    // The API might return an empty body on 200 OK, which would cause response.json() to throw.
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  async fetchBookmarkFolders(entity: string, id: string): Promise<BookmarkFolder[]> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/api/bookmarks/folders/${entity}/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch bookmark folders');
    return response.json();
  },

  async fetchAllBookmarkFolders(): Promise<any[]> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/api/bookmarks/folders`, { headers });
    if (!response.ok) throw new Error('Failed to fetch all bookmark folders');
    return response.json();
  },

  async fetchBookmarkList(folderId: number = 0, offset: number = 0, limit: number = 100): Promise<{ items: any[], totalRecords: number }> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/api/bookmarks/list/${folderId}?offset=${offset}&limit=${limit}&sort[id]=-1`, { headers });
    if (!response.ok) throw new Error('Failed to fetch bookmark list');
    return response.json();
  },

  async fetchContentTagBatch(entityName: string, recordIds: number[]): Promise<any[]> {
    if (recordIds.length === 0) return [];
    
    // Construct query parameters: ?entityName=post&recordId=1&recordId=2...
    const params = new URLSearchParams();
    params.append('entityName', entityName);
    recordIds.forEach(id => params.append('recordId', id.toString()));

    const response = await fetch(`${apiBaseUrl}/api/queries/contentTag?${params.toString()}`);
    if (!response.ok) throw new Error(`Failed to fetch content tags for entity ${entityName}`);
    return response.json();
  }
};
