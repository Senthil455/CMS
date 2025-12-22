declare module 'fastify-session-better-sqlite3-store' {
    import { SessionStore } from '@fastify/session';
    export default class SqliteStore implements SessionStore {
        constructor(db: any);
        set(sessionId: string, session: any, callback: (err?: any) => void): void;
        get(sessionId: string, callback: (err?: any, session?: any) => void): void;
        destroy(sessionId: string, callback: (err?: any) => void): void;
    }
}
