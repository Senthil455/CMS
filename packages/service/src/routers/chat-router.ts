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

    // POST: Trigger any page addon by id
    fastify.post(ENDPOINTS.CHAT.TRIGGER_ADDON, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { addonId, schemaId, providerName } = request.body as {
                addonId: string;
                schemaId: string;
                providerName?: string;
            };

            const addon = PAGE_ADDON_REGISTRY.find(a => a.id === addonId);
            if (!addon) {
                return reply.status(400).send({ success: false, error: `Unknown addon: ${addonId}` });
            }

            const userId = request.user!.id.toString();
            const externalCookie = request.headers.cookie || '';

            const onEvent = (event: string, payload: any) => {
                fastify.socketService.emitToUser(userId, event, payload);
            };

            const syntheticMessage = `@${addon.agentName} #${schemaId}: ${addon.chatMessage}`;

            await fastify.chatService.handleUserMessage(
                userId,
                syntheticMessage,
                externalCookie,
                providerName || 'gemini',
                onEvent
            );

            return { success: true, message: `${addon.label} triggered successfully` };
        } catch (error) {
            fastify.log.error(formatError(error));
            return reply.status(500).send({ success: false, error: 'Failed to trigger addon' });
        }
    });
};

export default chatRoutes;
