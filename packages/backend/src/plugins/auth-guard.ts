import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

const authGuard: FastifyPluginAsync = async (fastify) => {
    // Populate request.user if session exists
    fastify.addHook('preHandler', async (request: FastifyRequest) => {
        const cookieHeader = request.headers.cookie;
        if (cookieHeader) {
            const user = await fastify.authService.getUserProfile(cookieHeader);
            if (user) {
                request.user = user;
            }
        }
    });

    // Decorator to require authentication
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }
    });
};

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export default fp(authGuard);
