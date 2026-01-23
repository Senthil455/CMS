import {
    SOCKET_EVENTS,
    type ChatMessage,
    type SchemaSummary,
    type OnServerToClientEvent,
    type TemplateSelectionRequest,
    type TemplateSelectionResponse,
    AGENT_TRIGGERS
} from '@cms/shared';
import type { ChatContext, ChatHandler, HandlerType } from '../models/handlers/chat-handler';
import { PageGenerator } from '../models/handlers/page-generator';
import type { IChatRepository } from '../infrastructures/chat-repository.interface';
import type { ServiceLogger } from '../types/logger';
import type { CmsClient } from '../infrastructures/cms-client';
import { IntentClassifier } from '../models/handlers/intent-classifier';
import { SchemaManager } from '../models/cms/schema-manager';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly cmsClient: CmsClient,
        private readonly intentClassifier: Record<string, IntentClassifier>,
        private readonly chatHandlers: Record<string, Partial<Record<HandlerType, ChatHandler>>>,
        private readonly logger: ServiceLogger,
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
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, message);
        return message;
    }

    async handleUserMessage(
        userId: string,
        content: string,
        externalCookie: string,
        providerName: string,
        onEvent: OnServerToClientEvent): Promise<void> {
        // 1. Save and notify user message
        const userMessage = await this.saveUserMessage(userId, content);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);

        // 2. Intent Classifier
        let taskType: HandlerType | null = null;

        if (content.includes(AGENT_TRIGGERS.ENTITY_GENERATOR)) {
            taskType = AGENT_TRIGGERS.ENTITY_GENERATOR;
        } else if (content.includes(AGENT_TRIGGERS.PAGE_GENERATOR)) {
            taskType = AGENT_TRIGGERS.PAGE_GENERATOR;
        } else if (content.includes(AGENT_TRIGGERS.QUERY_GENERATOR)) {
            taskType = AGENT_TRIGGERS.QUERY_GENERATOR;
        } else if (content.includes(AGENT_TRIGGERS.DATA_GENERATOR)) {
            taskType = AGENT_TRIGGERS.DATA_GENERATOR;
        } else {
            taskType = await this.intentClassifier[providerName]!.resolve(content);
        }
        if (taskType) {
            const handler = this.chatHandlers[providerName]?.[taskType];
            if (handler) {
                this.logger.info('Executing resolved handler');

                const context: ChatContext = {
                    taskType,
                    userId,
                    externalCookie,
                    providerName,
                    saveAssistantMessage: async (content: string, payload?: any) => {
                        return this.saveAndEmitAssistantMessage(userId, content, onEvent, payload);
                    },
                    saveAiResponseLog: async (handlerName: string, response: string) => {
                        await this.repository.saveAiResponseLog(handlerName, response);
                    },
                    onConfirmSchemaSummary: async (summary: SchemaSummary) => {
                        onEvent(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, summary);
                    },
                    onSchemasSync: async (payload: any) => {
                        onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, payload);
                    },
                    onTemplateSelectionListToConfirm: async (payload: any) => {
                        onEvent(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, payload);
                    },
                    onTemplateSelectionDetailToConfirm: async (payload: any) => {
                        onEvent(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, payload);
                    }
                };

                await handler.handle(content, context);
                return;
            }

            // Fallback or default behavior if no command resolved
            const aiMessage = await this.saveAssistantMessage(userId, "I'm not sure how to help with that. Could you try rephrasing? (Tip: I can help you list, add, edit, or delete entities, or create new ones!)");
            onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, aiMessage);
        }
    }

    async handleSchemaSummaryResponse(userId: string, response: SchemaSummary, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        if (response.entities.length === 0) {
            await this.saveAssistantMessage(userId, 'No entities provided to commit.');
            return;
        }

        await this.saveAssistantMessage(userId, `Committing ${response.entities.length} entities to CMS...`);

        try {
            const schemaManager = new SchemaManager(this.cmsClient, this.logger, externalCookie);
            const schemaIds = await schemaManager.commit(response);
            onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
                task_type: 'entity_generator',
                schemasId: schemaIds
            });
            await this.saveAndEmitAssistantMessage(userId, 'All confirmed entities have been successfully committed to CMS. How else can I help?', onEvent);
        } catch (error) {
            this.logger.error({ error }, 'Failed to commit schema changes');
            await this.saveAndEmitAssistantMessage(userId, 'I encountered an error while committing your changes. Please check the logs and try again.', onEvent);
        }
    }

    async handleTemplateSelectionResponse(userId: string, response: TemplateSelectionResponse, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        const providerName = response.requestPayload.providerName || 'gemini';
        const handler = this.chatHandlers[providerName]?.[AGENT_TRIGGERS.PAGE_GENERATOR];
        if (handler instanceof PageGenerator) {
            const context: ChatContext = {
                taskType: AGENT_TRIGGERS.PAGE_GENERATOR,
                userId,
                externalCookie,
                providerName,
                saveAssistantMessage: async (content: string, payload?: any) => {
                    return this.saveAndEmitAssistantMessage(userId, content, onEvent, payload);
                },
                saveAiResponseLog: async (handlerName: string, response: string) => {
                    await this.repository.saveAiResponseLog(handlerName, response);
                },
                onConfirmSchemaSummary: async (summary: SchemaSummary) => {
                    onEvent(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, summary);
                },
                onSchemasSync: async (payload: any) => {
                    onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, payload);
                },
                onTemplateSelectionListToConfirm: async (payload: any) => {
                    onEvent(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, payload);
                },
                onTemplateSelectionDetailToConfirm: async (payload: any) => {
                    onEvent(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, payload);
                }
            };
            await handler.generateAndSave(response, context);
        } else {
            this.logger.error('PageGenerator handler not found or invalid type');
        }
    }
}
