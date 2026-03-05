export interface User {
    id: string | number;
    username: string;
    avatarUrl: string;
    email?: string;
    roles?: string[];
    allowedMenus?: string[];
}

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterReq {
    email: string;
    password: string;
    userName: string;
}

export interface ChangePasswordReq {
    oldPassword: string;
    password: string;
}

export interface UserAccess {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
    roles: string[];
    readWriteEntities: string[];
    readonlyEntities: string[];
    restrictedReadWriteEntities: string[];
    restrictedReadonlyEntities: string[];
    allowedMenus: string[];
    canAccessAdmin: boolean;
}

export interface SystemStatusResponse {
    databaseReady: boolean;
    hasSuperAdmin: boolean;
}

export interface ChatMessage {
    id: number;
    userId: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
    payload?: any;
    agentName?: string;
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
