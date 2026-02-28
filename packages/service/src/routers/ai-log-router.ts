import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const aiLogRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.LOGS, {
        preHandler: [fastify.authenticate]
    }, async () => {
        const logs = await fastify.aiResponseLogRepository.findAllAiResponseLogs();
        return { success: true, data: logs };
    });
    fastify.delete(ENDPOINTS.AI.DELETE_LOG, {
        preHandler: [fastify.authenticate]
    }, async (request) => {
        const { id } = request.params as { id: string };
        await fastify.aiResponseLogRepository.deleteAiResponseLog(parseInt(id));
        return { success: true };
    });
};

export default aiLogRouter;
