import type { FastifyPluginAsync } from 'fastify';
import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, type ClientToServerEvents, type ServerToClientEvents, type InterServerEvents, type SocketData, type OnServerToClientEvent, type ModelSelection, type AgentName } from '@cms/shared';
import { formatError } from '../utils/error-formatter';

const socketHandlerPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) throw err;

        fastify.io.on('connection', async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
            const user = socket.data.user;
            const userId = user.id.toString();

            const onEvent: OnServerToClientEvent = (event: any, ...args: any[]) => {
                socket.emit(event, ...args);
            };

            socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: { content: string, selection?: ModelSelection }) => {
                try {
                    const selection = data.selection || 'gemini/gemini-3-flash';
                    await fastify.chatService.handleUserMessage(userId, data.content, socket.data.externalCookie, selection, onEvent);
                } catch (error) {
                    console.error('Error handling message:', formatError(error));
                }
            });

            // Unified feedback response handler — replaces individual schema/template/system listeners
            socket.on(SOCKET_EVENTS.CHAT.AGENT_FEEDBACK_RESPONSE, async (data: { agentName: string; feedbackData: any; selection?: ModelSelection }) => {
                try {
                    const selection = data.selection || 'gemini/gemini-3-flash';
                    await fastify.chatService.handleAgentFeedback(
                        userId,
                        data.agentName as AgentName,
                        data.feedbackData,
                        socket.data.externalCookie,
                        selection,
                        onEvent
                    );
                } catch (error) {
                    console.error('Error handling agent feedback response:', formatError(error));
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    });
};

export default socketHandlerPlugin;
