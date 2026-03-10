export declare const ENDPOINTS: {
    readonly CHAT: {
        readonly HISTORY: "/cmsapi/chat/history";
        readonly STATUS: "/cmsapi/chat/status";
        readonly PAGE_ADDONS: "/cmsapi/page-addons";
        readonly CANCEL: "/cmsapi/chat/cancel";
    };
    readonly AUTH: {
        readonly LOGIN: "/api/login";
        readonly REGISTER: "/api/register";
        readonly LOGOUT: "/api/logout";
        readonly ME: "/api/me";
        readonly PROFILE_PASSWORD: "/api/profile/password";
        readonly PROFILE_AVATAR: "/api/profile/avatar";
    };
    readonly SYSTEM: {
        readonly IS_READY: "/api/system/is-ready";
    };
    readonly AI: {
        readonly PROVIDERS: "/cmsapi/ai/providers";
        readonly LOGS: "/cmsapi/ai/logs";
        readonly DELETE_LOG: "/cmsapi/ai/logs/:id";
    };
    readonly SCHEMA: {
        readonly ALL: "/api/schemas?type=";
        readonly SAVE: "/api/schemas";
        readonly DEFINE: "/api/schemas/entity/define";
        readonly DELETE: "/api/schemas/:id";
        readonly PUBLISH: "/api/schemas/publish";
        readonly HISTORY: "/api/schemas/history/:schemaId";
        readonly GET_BY_NAME: "/api/schemas/name/:name";
        readonly GET_BY_ID: "/api/schemas/:id";
        readonly GET_BY_SCHEMA_ID: "/api/schemas/schema/:id";
        readonly GET_ENTITY: "/api/schemas/entity/:entityName";
    };
    readonly QUERY: {
        readonly GET_DATA: "/api/queries/:id";
        readonly PAGE_DATA: "/api/page-data";
    };
    readonly ASSETS: {
        readonly BASE: "/api/assets";
        readonly BY_ID: "/api/assets/:id";
        readonly BY_PATH: "/api/assets/path";
        readonly ENTITY: "/api/assets/entity";
        readonly INFO: "/api/assets/base";
        readonly DELETE: "/api/assets/delete/:id/";
        readonly META: "/api/assets/meta/";
    };
    readonly TASKS: {
        readonly ENTITY: "/api/tasks/entity";
        readonly ALL: "/api/tasks";
        readonly EXPORT: "/api/tasks/export";
        readonly EMIT: "/api/tasks/emit";
        readonly IMPORT_DEMO: "/api/tasks/import/demo";
        readonly ARCHIVE: "/api/tasks/export/archive/:id";
        readonly DOWNLOAD: "/api/tasks/export/download/:id";
        readonly IMPORT: "/api/tasks/import";
    };
    readonly APP_TASKS: {
        readonly LATEST: "/cmsapi/tasks";
        readonly TOGGLE_ITEM: "/cmsapi/tasks/:taskId/items/:index/toggle";
    };
    readonly ENTITIES: {
        readonly LIST: "/api/entities/:schemaName";
        readonly TREE: "/api/entities/tree/:schemaName";
        readonly ITEM: "/api/entities/:schemaName/:id";
        readonly UPDATE: "/api/entities/:schemaName/update";
        readonly INSERT: "/api/entities/:schemaName/insert";
        readonly DELETE: "/api/entities/:schemaName/delete";
        readonly PUBLICATION: "/api/entities/:schemaName/publication";
        readonly JUNCTION_IDS: "/api/entities/junction/target_ids/:schemaName/:id/:field";
        readonly JUNCTION_DATA: "/api/entities/junction/:schemaName/:id/:field";
        readonly JUNCTION_SAVE: "/api/entities/junction/:schemaName/:id/:field/save";
        readonly JUNCTION_DELETE: "/api/entities/junction/:schemaName/:id/:field/delete";
        readonly COLLECTION: "/api/entities/collection/:schemaName/:id/:field";
        readonly COLLECTION_INSERT: "/api/entities/collection/:schemaName/:id/:field/insert";
        readonly LOOKUP: "/api/entities/lookup/:schemaName";
    };
    readonly CHUNKS: {
        readonly BASE: "/api/chunks/";
        readonly STATUS: "/api/chunks/status";
        readonly COMMIT: "/api/chunks/commit";
    };
    readonly NOTIFICATIONS: {
        readonly BASE: "/api/notifications";
    };
    readonly SUBSCRIPTIONS: {
        readonly PRICES: "/api/subscriptions/sub_prices";
        readonly SESSIONS: "/api/subscriptions/sub_sessions";
        readonly INFO: "/api/subscriptions/sub_info";
    };
    readonly ENGAGEMENTS: {
        readonly LIST: "/api/engagements/list/:type";
        readonly DELETE: "/api/engagements/delete/:id";
        readonly PAGE_COUNTS: "/api/engagements/page-counts";
        readonly VISIT_COUNTS: "/api/engagements/visit-counts";
        readonly COUNTS: "/api/engagements/counts";
    };
    readonly BOOKMARKS: {
        readonly FOLDERS: "/api/bookmarks/folders";
        readonly LIST: "/api/bookmarks/list/:folderId";
        readonly UPDATE_FOLDER: "/api/bookmarks/folders/update/:id";
        readonly DELETE_FOLDER: "/api/bookmarks/folders/delete/:id";
        readonly DELETE: "/api/bookmarks/delete/:id";
    };
    readonly GRAPHQL: "/graphql";
};
//# sourceMappingURL=endpoints.d.ts.map