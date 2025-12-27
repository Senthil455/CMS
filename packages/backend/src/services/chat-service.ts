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
import { IntentClassifier } from '../models/handlers/intent-classifier';
import { SchemaManager } from '../models/cms/schema-manager';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly cmsClient: CmsClient,
        private readonly intentClassifier: IntentClassifier,
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



        // 2. Intent Classifier
        const handler = await this.intentClassifier.resolve(content);
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

        try {
            const schemaManager = new SchemaManager(this.cmsClient, this.logger, externalCookie);
            await schemaManager.commit(response);
            await this.saveAndEmitAssistantMessage(userId, 'All confirmed entities have been successfully committed to CMS. How else can I help?', onEvent);
        } catch (error) {
            this.logger.error({ error }, 'Failed to commit schema changes');
            await this.saveAndEmitAssistantMessage(userId, 'I encountered an error while committing your changes. Please check the logs and try again.', onEvent);
        }
    }
}
