import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ENDPOINTS, SOCKET_EVENTS, AGENT_NAMES } from '@cms/shared';
import { formatError } from '../utils/error-formatter';

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

    fastify.post(ENDPOINTS.CHAT.ENGAGEMENT_BAR, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { schemaId, providerName } = request.body as { schemaId: string, providerName?: string };
            const userId = request.user!.id.toString();
            const externalCookie = request.headers.cookie || '';

            // Define onEvent to emit to the specific user via socket
            const onEvent = (event: string, payload: any) => {
                fastify.socketService.emitToUser(userId, event, payload);
            };

            // Synthesize the user message that triggers the agent
            const syntheticMessage = `@${AGENT_NAMES.ENGAGEMENT_BAR_BUILDER} #${schemaId}: Add engagement bar code to this page`;

            // Trigger the existing chat pipeline
            // This will run asynchronously in terms of "agent thinking", but we await the initial handling.
            // Note: handleUserMessage connects to executeAgent which awaits the full chain.
            await fastify.chatService.handleUserMessage(
                userId,
                syntheticMessage,
                externalCookie,
                providerName || 'gemini', // default provider
                onEvent
            );

            return { success: true, message: 'Engagement Bar Generator triggered successfully' };
        } catch (error) {
            fastify.log.error(formatError(error));
            return reply.status(500).send({ success: false, error: 'Failed to trigger Engagement Bar Generator' });
        }
    });

    fastify.post(ENDPOINTS.CHAT.USER_AVATAR, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { schemaId, providerName } = request.body as { schemaId: string, providerName?: string };
            const userId = request.user!.id.toString();
            const externalCookie = request.headers.cookie || '';

            const onEvent = (event: string, payload: any) => {
                fastify.socketService.emitToUser(userId, event, payload);
            };

            const syntheticMessage = `@${AGENT_NAMES.USER_AVATAR_BUILDER} #${schemaId}: Add user avatar to header`;

            await fastify.chatService.handleUserMessage(
                userId,
                syntheticMessage,
                externalCookie,
                providerName || 'gemini',
                onEvent
            );

            return { success: true, message: 'User Avatar Generator triggered successfully' };
        } catch (error) {
            fastify.log.error(formatError(error));
            return reply.status(500).send({ success: false, error: 'Failed to trigger User Avatar Generator' });
        }
    });

    fastify.post(ENDPOINTS.CHAT.VISIT_TRACK, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { schemaId, providerName } = request.body as { schemaId: string, providerName?: string };
            const userId = request.user!.id.toString();
            const externalCookie = request.headers.cookie || '';

            const onEvent = (event: string, payload: any) => {
                fastify.socketService.emitToUser(userId, event, payload);
            };

            const syntheticMessage = `@${AGENT_NAMES.VISIT_TRACKER} #${schemaId}: Add visit tracking to this page`;

            await fastify.chatService.handleUserMessage(
                userId,
                syntheticMessage,
                externalCookie,
                providerName || 'gemini',
                onEvent
            );

            return { success: true, message: 'Visit Track Generator triggered successfully' };
        } catch (error) {
            fastify.log.error(formatError(error));
            return reply.status(500).send({ success: false, error: 'Failed to trigger Visit Track Generator' });
        }
    });

    fastify.post(ENDPOINTS.CHAT.TOP_LIST, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { schemaId, providerName } = request.body as { schemaId: string, providerName?: string };
            const userId = request.user!.id.toString();
            const externalCookie = request.headers.cookie || '';

            const onEvent = (event: string, payload: any) => {
                fastify.socketService.emitToUser(userId, event, payload);
            };

            const syntheticMessage = `@${AGENT_NAMES.TOP_LIST_BUILDER} #${schemaId}: Add top list component to this page`;

            await fastify.chatService.handleUserMessage(
                userId,
                syntheticMessage,
                externalCookie,
                providerName || 'gemini',
                onEvent
            );

            return { success: true, message: 'Top List Generator triggered successfully' };
        } catch (error) {
            fastify.log.error(formatError(error));
            return reply.status(500).send({ success: false, error: 'Failed to trigger Top List Generator' });
        }
    });
};

export default chatRoutes;
