export const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_URL ?? import.meta.env.VITE_APP_API_URL ?? '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`);
  }
  return response;
}

/** Convenience for JSON responses */
export async function apiFetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(path, options);
  const text = await res.text();
  return text ? JSON.parse(text) : null as any;
}
