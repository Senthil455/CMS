import type { FastifyPluginAsync } from 'fastify';
import { type Socket } from 'socket.io';
import { SOCKET_EVENTS, type ClientToServerEvents, type ServerToClientEvents, type InterServerEvents, type SocketData, type SchemaSummary, type OnServerToClientEvent, type SystemRequirmentConfirmationDto } from '@cms/shared';
import { formatError } from '../utils/error-formatter';

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

            socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data: { content: string, providerName?: string }) => {
                try {
                    const providerName = data.providerName || config.AI_PROVIDER;
                    await fastify.chatService.handleUserMessage(userId, data.content, socket.data.externalCookie, providerName, onEvent);
                } catch (error) {
                    console.error('Error handling message:', formatError(error));
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE, async (data: SchemaSummary) => {
                try {
                    await fastify.chatService.handleSchemaSummaryResponse(userId, data, socket.data.externalCookie, onEvent);
                } catch (error) {
                    console.error('Error handling schema summary response:', formatError(error));
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_RESPONSE, async (data: any) => {
                try {
                    await fastify.chatService.handleTemplateSelectionResponse(userId, data, socket.data.externalCookie, onEvent);
                } catch (error) {
                    console.error('Error handling template selection response:', formatError(error));
                }
            });

            socket.on(SOCKET_EVENTS.CHAT.SYSTEM_PLAN_RESPONSE, async (data: SystemRequirmentConfirmationDto) => {
                try {
                    await fastify.chatService.handleSystemPlanResponse(userId, data, socket.data.externalCookie, onEvent);
                } catch (error) {
                    console.error('Error handling system plan response:', formatError(error));
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    });
};

export default socketHandlerPlugin;
