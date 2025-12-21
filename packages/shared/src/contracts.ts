export interface ChatMessage {
    id: number;
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
}

export interface SaveMessageRequest {
    content: string;
    role: 'user' | 'assistant';
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
