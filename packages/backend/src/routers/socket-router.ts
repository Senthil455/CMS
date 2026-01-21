import type { FastifyPluginAsync } from 'fastify';
import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, type ClientToServerEvents, type ServerToClientEvents, type InterServerEvents, type SocketData, type SchemaSummary, type OnServerToClientEvent } from '@cms/shared';

import { config } from '../config';

const socketHandlerPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.ready((err) => {
        if (err) throw err;

        fastify.io.on('connection', async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
            const user = socket.data.user;
            const userId = user.id.toString();

            const onEvent: OnServerToClientEvent = (event: any, ...args: any[]) => {
                socket.emit(event, ...args);
            };

            socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: { content: string, agentName?: string }) => {
                try {
                    const agentName = data.agentName || config.AI_AGENT;
                    await fastify.chatService.handleUserMessage(userId, data.content, socket.data.externalCookie, agentName, onEvent);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE, async (data: SchemaSummary) => {
                try {
                    await fastify.chatService.handleSchemaSummaryResponse(userId, data, socket.data.externalCookie, onEvent);
                } catch (error) {
                    console.error('Error handling schema summary response:', error);
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_RESPONSE, async (data: any) => {
                try {
                    const agentName = config.AI_AGENT;
                    await fastify.chatService.handleTemplateSelectionResponse(userId, agentName, data, socket.data.externalCookie, onEvent);
                } catch (error) {
                    console.error('Error handling template selection response:', error);
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    });
};

export default socketHandlerPlugin;
