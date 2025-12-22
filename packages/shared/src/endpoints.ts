export const ENDPOINTS = {
    CHAT: {
        HISTORY: '/api/chat/history',
    },
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
    }
} as const;
