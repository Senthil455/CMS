export const ENDPOINTS = {
    CHAT: {
        HISTORY: '/cmsapi/chat/history',
    },
    AUTH: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        ME: '/api/me',
    },
    AI: {
        AGENTS: '/cmsapi/ai/agents',
        LOGS: '/cmsapi/ai/logs',
    },
    SCHEMA: {
        ALL: '/api/schemas?type=',
        SAVE: '/api/schemas/save',
    }
} as const;
