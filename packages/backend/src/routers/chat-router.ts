import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const chatRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get(ENDPOINTS.CHAT.HISTORY, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { limit, beforeId } = request.query as { limit?: string; beforeId?: string };
            const history = await fastify.chatService.getHistory(
                request.user!.id.toString(),
                limit ? parseInt(limit) : 10,
                beforeId ? parseInt(beforeId) : undefined
            );
            return { success: true, data: history };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch history' });
        }
    });
};

export default chatRoutes;
