import type { FastifyPluginAsync } from 'fastify';
import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, type ClientToServerEvents, type ServerToClientEvents, type InterServerEvents, type SocketData, type ChatMessage, type SchemaSummaryResponse } from '@cms/shared';

const socketHandlerPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) throw err;

        fastify.io.on('connection', async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
            const user = socket.data.user;
            const userId = user.id.toString();

            socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: { content: string }) => {
                try {
                    await fastify.chatService.handleUserMessage(userId, data.content, socket.data.externalCookie, <K extends keyof ServerToClientEvents>(event: K, ...args: Parameters<ServerToClientEvents[K]>) => {
                        socket.emit(event, ...args);
                    });
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE, async (data: SchemaSummaryResponse) => {
                try {
                    await fastify.chatService.handleSchemaSummaryResponse(userId, data, socket.data.externalCookie);
                } catch (error) {
                    console.error('Error handling schema summary response:', error);
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    });
};

export default socketHandlerPlugin;
