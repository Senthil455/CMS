import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import SqliteStore from 'fastify-session-better-sqlite3-store';
import Database from 'better-sqlite3';
import fastifyIO from 'fastify-socket.io';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
    logger: {
        mixin: () => {
            const stack = new Error().stack;
            if (!stack) return {};
            const lines = stack.split('\n');
            // Index 4 is usually the caller in this Fastify/Pino setup
            const callerLine = lines[4] || '';
            const match = callerLine.match(/\((.*):(\d+):(\d+)\)$|at (.*):(\d+):(\d+)$/);
            if (match) {
                const fullPath = match[1] || match[4];
                const line = match[2] || match[5];
                if (fullPath) {
                    const fileName = fullPath.split('/').pop();
                    return { caller: `${fileName}:${line}` };
                }
            }
            return {};
        },
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                messageFormat: '{caller} {msg}',
            },
        },
    },
});

async function start() {
    try {
        // Register CORS
        await server.register(cors, {
            origin: config.FRONTEND_URL,
            credentials: true,
        });

        await server.register(cookie);

        // Register Session with SQLite store
        const db = new Database('sessions.db');
        const store = new SqliteStore(db);
        server.decorate('sessionStore', store);

        await server.register(session, {
            secret: config.SESSION_SECRET,
            cookieName: config.SESSION_COOKIE_NAME,
            store,
            cookie: {
                secure: false, // Set to true in production
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: config.SESSION_MAX_AGE,
            }
        });

        // Register Socket.io
        await server.register(fastifyIO, {
            cors: {
                origin: config.FRONTEND_URL,
                credentials: true,
            },
        });

        // Register Plugins (DI, etc.)
        await server.register(autoload, {
            dir: join(__dirname, 'plugins'),
        });

        // Register Routers
        await server.register(autoload, {
            dir: join(__dirname, 'routers'),
        });

        await server.listen({ port: config.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server ready at http://localhost:${config.PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();
