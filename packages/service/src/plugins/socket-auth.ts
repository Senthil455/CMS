import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const socketAuthPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) return;

        fastify.io.use(async (socket: any, next: (err?: Error) => void) => {
            try {
                const cookieHeader = socket.request.headers.cookie;
                if (!cookieHeader) {
                    return next(new Error('Unauthorized: No cookies'));
                }

                const user = await fastify.authService.getUserProfile(cookieHeader);
                if (!user) {
                    return next(new Error('Unauthorized: External profile invalid'));
                }

                // Store user and externalCookie in socket.data for later use
                socket.data.user = user;
                socket.data.externalCookie = cookieHeader;
                next();
            } catch (err) {
                next(new Error('Internal authentication error'));
            }
        });
    });
};

export default fp(socketAuthPlugin);
