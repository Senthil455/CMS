import { apiFetchJson } from './client';

export const progressApi = {
  fetchProgressRecords: (userId: string) =>
    apiFetchJson<{ items: any[]; totalRecords: number }>(
      `/api/entities/progress?createdBy[equals]=${userId}`
    ),

  insertProgress: (progressJson: string) =>
    apiFetchJson<any>(`/api/entities/progress/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'TTS Progress',
        progress: progressJson,
      }),
    }),

  updateProgress: (id: number, progressJson: string, updatedAt: string) =>
    apiFetchJson<any>(`/api/entities/progress/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updatedAt,
        description: 'TTS Progress',
        progress: progressJson,
      }),
    }),
};
