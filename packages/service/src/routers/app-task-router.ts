import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const appTaskRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.APP_TASKS.LATEST, {
        preHandler: [fastify.authenticate]
    }, async (request) => {
        const { limit } = request.query as { limit?: string };
        const tasks = await fastify.agentTaskRepository.findLatest(limit ? parseInt(limit, 10) : 20);
        return { success: true, data: tasks };
    });
};

export default appTaskRouter;
