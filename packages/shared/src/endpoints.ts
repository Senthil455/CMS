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
    },
    SCHEMA: {
        ALL: '/api/schemas',
        SAVE: '/api/schemas/save',
    }
} as const;
