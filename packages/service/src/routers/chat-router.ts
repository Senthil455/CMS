import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ENDPOINTS, SOCKET_EVENTS, AGENT_NAMES } from '@cms/shared';
import { formatError } from '../utils/error-formatter';
import { PAGE_ADDON_REGISTRY } from '../agent/page-addons/index';

const chatRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get(ENDPOINTS.CHAT.HISTORY, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { limit, beforeId } = request.query as { limit?: string; beforeId?: string };
            const history = await fastify.chatMessageRepository.findAll(
                request.user!.id.toString(),
                limit ? parseInt(limit) : 10,
                beforeId ? parseInt(beforeId) : undefined
            );
            return { success: true, data: history };
        } catch (error) {
            fastify.log.error(formatError(error));
            return reply.status(500).send({ success: false, error: 'Failed to fetch history' });
        }
    });

    fastify.post(ENDPOINTS.CHAT.CANCEL, { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const cancelled = await fastify.chatService.cancelActiveRequest(request.user!.id.toString());
        return reply.send({ success: true, cancelled });
    });

    fastify.get(ENDPOINTS.CHAT.STATUS, {
        preHandler: [fastify.authenticate]
    }, async (request) => {
        const userId = request.user!.id.toString();
        const statuses = fastify.statusService.getStatuses(userId);
        return { success: true, data: { statuses } };
    });

    // --- Page Addons ---

    // GET: Return the list of available page addons (for frontend dropdown)
    fastify.get(ENDPOINTS.CHAT.PAGE_ADDONS, {
        preHandler: [fastify.authenticate]
    }, async () => {
        return { success: true, data: PAGE_ADDON_REGISTRY };
    });

};

export default chatRoutes;
