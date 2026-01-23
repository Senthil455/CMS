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
        PROVIDERS: '/cmsapi/ai/providers',
        LOGS: '/cmsapi/ai/logs',
        ACT_ON_LOG: '/cmsapi/ai/logs/:id/act',
    },
    SCHEMA: {
        ALL: '/api/schemas?type=',
        SAVE: '/api/schemas',
        DEFINE: '/api/schemas/entity/define',
        DELETE: '/api/schemas/:id',
        PUBLISH: '/api/schemas/publish',
        HISTORY: '/api/schemas/history/:schemaId',
    },
    QUERY: {
        GET_DATA: '/api/queries/:id',
        PAGE_DATA: '/api/page-data',
    },
    ASSETS: '/api/assets',
    GRAPHQL: '/graphql',
} as const;
