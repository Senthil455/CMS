import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const aiLogRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.LOGS, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { chatService } = fastify as any;
        const logs = await chatService.getAiResponseLogs();
        return { success: true, data: logs };
    });
};

export default aiLogRouter;
