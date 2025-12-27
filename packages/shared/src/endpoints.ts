export const ENDPOINTS = {
    CHAT: {
        HISTORY: '/api/chat/history',
    },
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
    },
    AI: {
        AGENTS: '/api/ai/agents',
    }
} as const;
