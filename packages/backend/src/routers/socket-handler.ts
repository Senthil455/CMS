import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SOCKET_EVENTS } from '@cms/shared';
import type { ChatMessage } from '@cms/shared';

const socketHandlerPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) throw err;

        fastify.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on(SOCKET_EVENTS.CHAT.GET_HISTORY, async () => {
                try {
                    const history = await fastify.chatService.getHistory();
                    socket.emit(SOCKET_EVENTS.CHAT.HISTORY_LOADED, history);
                } catch (error) {
                    console.error('Error fetching history:', error);
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: { content: string }) => {
                try {
                    await fastify.chatService.handleUserMessage(data.content, (message) => {
                        // Broadcast new messages to everyone
                        fastify.io.emit(SOCKET_EVENTS.CHAT.NEW_MESSAGE, message);

                        // If it's the message just sent by this socket, optionally send a confirmation
                        if (message.role === 'user' && message.content === data.content) {
                            socket.emit(SOCKET_EVENTS.CHAT.MESSAGE_SAVED, { success: true, message });
                        }
                    });
                } catch (error) {
                    console.error('Error handling message:', error);
                    socket.emit(SOCKET_EVENTS.CHAT.MESSAGE_SAVED, { success: false, error: 'Failed to process message' });
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    });
};

export default socketHandlerPlugin;
