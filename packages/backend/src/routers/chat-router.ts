import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ENDPOINTS, SOCKET_EVENTS } from '@cms/shared';

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

    fastify.post(ENDPOINTS.CHAT.ENGAGEMENT_BAR, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { schemaId } = request.body as { schemaId: string };
            const userId = request.user!.id.toString();
            const externalCookie = request.cookies['cms-auth'] || '';

            // Define onEvent to emit to the specific user via socket
            const onEvent = (event: string, payload: any) => {
                fastify.socketService.emitToUser(userId, event, payload);
            };

            // Synthesize the user message that triggers the agent
            const syntheticMessage = `@engagement_bar #${schemaId}: Add engagement bar code to this page`;

            // Trigger the existing chat pipeline
            // This will run asynchronously in terms of "agent thinking", but we await the initial handling.
            // Note: handleUserMessage connects to executeAgent which awaits the full chain.
            await fastify.chatService.handleUserMessage(
                userId,
                syntheticMessage,
                externalCookie,
                'gemini', // default provider
                onEvent
            );

            return { success: true, message: 'Engagement Bar Agent triggered successfully' };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: 'Failed to trigger Engagement Bar Agent' });
        }
    });
};

export default chatRoutes;
