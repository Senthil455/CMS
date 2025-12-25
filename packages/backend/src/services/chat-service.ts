import {
    SOCKET_EVENTS,
    type ChatMessage,
    type ServerToClientEvents,
    type SchemaSummary,
    type OnServerToClientEvent,
    type EntityDto,
    type AttributeDto,
    type SaveEntityPayload
} from '@cms/shared';
import type { ChatContext } from '../models/handlers/chat-handler';
import type { IChatRepository } from '../infrastructures/chat-repository.interface';
import type { ServiceLogger } from '../types/logger';
import type { CmsClient } from '../infrastructures/cms-client';
import type { AgentMessage } from '../infrastructures/agent.interface';
import { HandlerResolver } from '../models/handlers/handler-resolver';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly cmsClient: CmsClient,
        private readonly handlerResolver: HandlerResolver,
        private readonly logger: ServiceLogger
    ) { }

    async getHistory(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]> {
        return this.repository.findAll(userId, limit, beforeId);
    }

    async saveUserMessage(userId: string, content: string): Promise<ChatMessage> {
        return this.repository.save({ userId, content, role: 'user' });
    }

    async saveAssistantMessage(userId: string, content: string, payload?: any): Promise<ChatMessage> {
        return this.repository.save({ userId, content, role: 'assistant', payload });
    }

    async getAiResponseLogs(): Promise<any[]> {
        return this.repository.findAllAiResponseLogs();
    }

    // Helper method to save and emit assistant messages
    private async saveAndEmitAssistantMessage(
        userId: string,
        content: string,
        onEvent: OnServerToClientEvent,
        payload?: any
    ): Promise<ChatMessage> {
        const message = await this.saveAssistantMessage(userId, content, payload);
        onEvent(SOCKET_EVENTS.CHAT.NEW_MESSAGE, message);
        return message;
    }

    async handleUserMessage(userId: string, content: string, externalCookie: string,
        onEvent: OnServerToClientEvent): Promise<void> {
        // 1. Save and notify user message
        const userMessage = await this.saveUserMessage(userId, content);
        onEvent(SOCKET_EVENTS.CHAT.NEW_MESSAGE, userMessage);



        // 2. Handler Resolver
        const handler = await this.handlerResolver.resolve(content);
        if (handler) {
            this.logger.info('Executing resolved handler');

            const context: ChatContext = {
                userId,
                externalCookie,
                saveAssistantMessage: async (content: string, payload?: any) => {
                    return this.saveAndEmitAssistantMessage(userId, content, onEvent, payload);
                },
                saveAiResponseLog: async (handlerName: string, response: string) => {
                    await this.repository.saveAiResponseLog(handlerName, response);
                },
                onConfirmSchemaSummary: async (summary: SchemaSummary) => {
                    onEvent(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, summary);
                }
            };

            await handler.handle(content, '', context);
            return;
        }

        // Fallback or default behavior if no command resolved
        const aiMessage = await this.saveAssistantMessage(userId, "I'm not sure how to help with that. Could you try rephrasing? (Tip: I can help you list, add, edit, or delete entities, or create new ones!)");
        onEvent(SOCKET_EVENTS.CHAT.NEW_MESSAGE, aiMessage);
    }

    async handleSchemaSummaryResponse(userId: string, response: SchemaSummary, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        if (response.entities.length === 0) {
            await this.saveAssistantMessage(userId, 'No entities provided to commit.');
            return;
        }

        await this.saveAssistantMessage(userId, `Committing ${response.entities.length} entities to CMS...`);

        for (const item of response.entities) {

            try {
                const payload: SaveEntityPayload = {
                    schemaId: item.schemaId || null,
                    type: 'entity',
                    settings: {
                        entity: item
                    }
                };

                await this.cmsClient.saveEntity(externalCookie, payload);
                this.logger.info({ entityName: item.name }, 'Successfully committed entity');
            } catch (saveError) {
                this.logger.error({ error: saveError, entityName: item.name }, 'Failed to commit entity');
            }
        }

        await this.saveAndEmitAssistantMessage(userId, 'All confirmed entities have been successfully committed to CMS. How else can I help?', onEvent);
    }
}
