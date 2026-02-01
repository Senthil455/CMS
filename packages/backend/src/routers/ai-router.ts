import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const aiRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.PROVIDERS, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const agents = Object.keys(fastify.aiProvider);
        return { success: true, data: agents };
    });
};

export default aiRouter;
