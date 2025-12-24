import type { FastifyPluginAsync } from 'fastify';

const aiLogRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get('/api/ai-logs', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { chatService } = fastify as any;
        const logs = await chatService.getAiResponseLogs();
        return { success: true, data: logs };
    });
};

export default aiLogRouter;
