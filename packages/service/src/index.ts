import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import SqliteStore from 'fastify-session-better-sqlite3-store';
import Database from 'better-sqlite3';
import fastifyIO from 'fastify-socket.io';
import autoload from '@fastify/autoload';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config';
import proxy from '@fastify/http-proxy';
import { createReadStream } from 'fs';
import { UserVisibleError } from './agent/user-visible-error';
import { CmsError } from './infrastructures/cms-error';
import { AgentProviderError } from './infrastructures/agent-provider-error';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
    logger: {
        level: config.LOG_LEVEL_FASTIFY,
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
                ignore: 'pid,hostname,component',
                messageFormat: '{caller} {msg}',
            },
        },
    },
});

async function start() {
    try {
        // Register CORS
        const allowedOrigins = [
            config.FRONTEND_URL,
            config.FRONTEND_URL.replace('localhost', '127.0.0.1'),
            config.FRONTEND_URL.replace('127.0.0.1', 'localhost'),
        ];

        await server.register(cors, {
            origin: allowedOrigins,
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
            path: '/cmsapi/socket.io',
            cors: {
                origin: allowedOrigins,
                credentials: true,
            },
        });

        // Register Plugins (DI, etc.)
        await server.register(autoload, {
            dir: join(__dirname, 'plugins'),
        });

        // Register Static Files for Admin
        const adminDistPath = join(__dirname, '../../admin/dist');
        await server.register(fastifyStatic, {
            root: adminDistPath,
            prefix: '/admin/',
            // decorateReply: true // Default is true, needed for sendFile to work
        });

        // Register Static Files for Portal
        const portalDistPath = join(__dirname, '../../portal/dist');
        await server.register(fastifyStatic, {
            root: portalDistPath,
            prefix: '/portal/',
            decorateReply: false,
        });

        // Register Static Files for CMS
        const appDistPath = join(__dirname, '../../app/dist');
        await server.register(fastifyStatic, {
            root: appDistPath,
            prefix: '/app/',
            decorateReply: false,
        });

        // Register Static Files for Stash
        const stashDistPath = join(__dirname, '../../stash/dist');
        await server.register(fastifyStatic, {
            root: stashDistPath,
            prefix: '/stash/',
            decorateReply: false,
        });

        // Register Backend Static Files (e.g. common JS)
        const publicPath = join(__dirname, '../public/static');
        await server.register(fastifyStatic, {
            root: publicPath,
            prefix: '/static/',
            decorateReply: false,
        });


        console.log("8. Setting Global Error Handler...");
        server.setErrorHandler((error, request, reply) => {
            if (error.validation) {
                return reply.status(400).send({ error: 'Validation failed', details: error.validation });
            }

            if (error instanceof UserVisibleError || error instanceof CmsError || error instanceof AgentProviderError) {
                return reply.status(400).send({ success: false, error: error.message });
            }

            if ((error as any).code === 'P2002') {
                return reply.status(409).send({ success: false, error: 'Resource conflict or already exists' });
            }
            if ((error as any).code === 'P2025') {
                return reply.status(404).send({ success: false, error: 'Resource not found' });
            }

            server.log.error(error);
            reply.status(500).send({ success: false, error: 'I encountered an internal error while processing your request. Please try again later.' });
        });

        console.log("9. Setting Not Found Handler...");
        server.setNotFoundHandler((request, reply) => {
            if (request.url.startsWith('/admin')) {
                reply.type('text/html');
                return reply.send(createReadStream(join(adminDistPath, 'index.html')));
            }
            if (request.url.startsWith('/portal')) {
                reply.type('text/html');
                return reply.send(createReadStream(join(portalDistPath, 'index.html')));
            }
            if (request.url.startsWith('/app')) {
                reply.type('text/html');
                return reply.send(createReadStream(join(appDistPath, 'index.html')));
            }
            if (request.url.startsWith('/stash')) {
                reply.type('text/html');
                return reply.send(createReadStream(join(stashDistPath, 'index.html')));
            }
            reply.status(404).send({ error: 'Not Found' });
        });

        // Register Routers
        await server.register(autoload, {
            dir: join(__dirname, 'routers'),
        });

        // Register Proxy for /api
        await server.register(proxy, {
            upstream: config.CMS_BASE_URL,
            prefix: '/api/',
            rewritePrefix: '/api/',
            http2: false,
        });

        // Register Proxy for /graphql
        await server.register(proxy, {
            upstream: config.CMS_BASE_URL,
            prefix: '/graphql',
            rewritePrefix: '/graphql',
            http2: false,
        });

        await server.listen({ port: config.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server ready at http://localhost:${config.PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();
