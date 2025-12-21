import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const chatRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get(ENDPOINTS.CHAT.HISTORY, async (request, reply) => {
        try {
            const history = await fastify.chatService.getHistory();
            return { success: true, data: history };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to fetch history' });
        }
    });
};

export default chatRoutes;
