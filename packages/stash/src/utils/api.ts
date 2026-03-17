import { Content } from '@/types'

const API_BASE = (import.meta as any).env?.VITE_APP_API_URL || '/api'

export async function fetchContentList(): Promise<Content[]> {
  try {
    const response = await fetch(`${API_BASE}/content`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch content list:', error)
    throw error
  }
}

export async function fetchContentById(id: string): Promise<Content> {
  try {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch content ${id}:`, error)
    throw error
  }
}

export async function pushContentChanges(data: {
  created: Content[]
  updated: Content[]
  deleted: string[]
}): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/content/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to push content changes:', error)
    throw error
  }
}

export async function createContent(content: Omit<Content, 'id'>): Promise<Content> {
  try {
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to create content:', error)
    throw error
  }
}

export async function updateContent(id: string, content: Partial<Content>): Promise<Content> {
  try {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to update content ${id}:`, error)
    throw error
  }
}

export async function deleteContent(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
  } catch (error) {
    console.error(`Failed to delete content ${id}:`, error)
    throw error
  }
}
