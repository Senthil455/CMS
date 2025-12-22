import type { FastifyPluginAsync } from 'fastify';
import { SOCKET_EVENTS } from '@cms/shared';

const socketHandlerPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) throw err;

        fastify.io.on('connection', async (socket: any) => {
            const user = socket.data.user;
            const userId = user.id.toString();
            console.log('User connected:', user.username, socket.id);

            socket.on(SOCKET_EVENTS.CHAT.GET_HISTORY, async () => {
                try {
                    const history = await fastify.chatService.getHistory(userId);
                    socket.emit(SOCKET_EVENTS.CHAT.HISTORY_LOADED, history);
                } catch (error) {
                    console.error('Error fetching history:', error);
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: { content: string }) => {
                try {
                    await fastify.chatService.handleUserMessage(userId, data.content, socket.data.externalCookie, (message: any) => {
                        // Emit new messages only to the sender (private chat)
                        socket.emit(SOCKET_EVENTS.CHAT.NEW_MESSAGE, message);

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
