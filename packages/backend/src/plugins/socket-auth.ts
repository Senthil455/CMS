import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import * as cookie from 'cookie';
import { unsign } from 'cookie-signature';
import { config } from '../config';

const socketAuthPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) return;

        fastify.io.use(async (socket: any, next: (err?: Error) => void) => {
            try {
                const cookieHeader = socket.request.headers.cookie;
                if (!cookieHeader) {
                    return next(new Error('Unauthorized: No cookies'));
                }

                const cookies = cookie.parse(cookieHeader);
                const signedSessionId = cookies[config.SESSION_COOKIE_NAME];

                if (!signedSessionId) {
                    return next(new Error('Unauthorized: No session cookie'));
                }

                const sessionId = unsign(signedSessionId, config.SESSION_SECRET);
                if (!sessionId) {
                    return next(new Error('Unauthorized: Invalid signature'));
                }

                const session: any = await new Promise((resolve) => {
                    fastify.sessionStore.get(sessionId, (err, session) => {
                        if (err || !session) resolve(null);
                        else resolve(session);
                    });
                });

                if (!session || !session.externalCookie) {
                    return next(new Error('Unauthorized: No active session data'));
                }

                const user = await fastify.authService.getUserProfile(session.externalCookie);
                if (!user) {
                    return next(new Error('Unauthorized: External profile invalid'));
                }

                // Store user and externalCookie in socket.data for later use
                socket.data.user = user;
                socket.data.externalCookie = session.externalCookie;
                next();
            } catch (err) {
                next(new Error('Internal authentication error'));
            }
        });
    });
};

export default fp(socketAuthPlugin);
