export interface User {
    id: string | number;
    username: string;
    avatarUrl: string;
}

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface ChatMessage {
    id: number;
    userId: string;
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
