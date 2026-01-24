import {
    SOCKET_EVENTS,
    type ChatMessage,
    type SchemaSummary,
    type OnServerToClientEvent,
    type TemplateSelectionResponse,
    AGENT_NAMES,
    type AgentName
} from '@cms/shared';
import type { Agent, AgentContext } from '../models/agents/chat-agent';
import { HtmlGenerator } from '../models/agents/html-generator';
import type { IChatRepository } from '../infrastructures/chat-repository.interface';
import type { ServiceLogger } from '../types/logger';
import type { CmsClient } from '../infrastructures/cms-client';
import { IntentClassifier } from '../models/agents/intent-classifier';
import { SchemaManager } from '../models/cms/schema-manager';

export class ChatService {
    constructor(
        private readonly repository: IChatRepository,
        private readonly cmsClient: CmsClient,
        private readonly intentClassifier: Record<string, IntentClassifier>,
        private readonly chatHandlers: Record<string, Partial<Record<AgentName, Agent>>>,
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

    async deleteAiResponseLog(id: number): Promise<void> {
        return this.repository.deleteAiResponseLog(id);
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
        let taskType: AgentName | null = null;

        if (content.trim().startsWith('@')) {
            // Check for explicit trigger (e.g. "@entity_generator")
            const explicitTrigger = Object.values(AGENT_NAMES).find(trigger => content.includes(`@${trigger}`));
            if (explicitTrigger) {
                taskType = explicitTrigger;
            }
        }

        if (!taskType) {
            taskType = await this.intentClassifier[providerName]!.resolve(content);
        }

        if (taskType) {
            const handler = this.chatHandlers[providerName]?.[taskType];
            if (handler) {
                this.logger.info('Executing resolved handler');

                const context: AgentContext = {
                    taskType,
                    userId,
                    externalCookie,
                    providerName,
                    saveAssistantMessage: async (content: string, payload?: any) => {
                        return this.saveAndEmitAssistantMessage(userId, content, onEvent, payload);
                    },
                    saveAiResponseLog: async (handlerName: string, response: string) => {
                        await this.repository.saveAiResponseLog(handlerName, response, providerName);
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
        const handler = this.chatHandlers[providerName]?.[AGENT_NAMES.HTML_GENERATOR];
        if (handler instanceof HtmlGenerator) {
            const context: AgentContext = {
                taskType: AGENT_NAMES.HTML_GENERATOR,
                userId,
                externalCookie,
                providerName,
                saveAssistantMessage: async (content: string, payload?: any) => {
                    return this.saveAndEmitAssistantMessage(userId, content, onEvent, payload);
                },
                saveAiResponseLog: async (handlerName: string, response: string) => {
                    await this.repository.saveAiResponseLog(handlerName, response, providerName);
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
            await handler.handle(JSON.stringify(response), context);
        } else {
            this.logger.error('HtmlGenerator handler not found or invalid type');
        }
    }
    async actOnLog(logId: number, userId: string, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        const log = await this.repository.findAiResponseLogById(logId);
        if (!log) {
            throw new Error(`Log with ID ${logId} not found`);
        }

        const responseContent = log.response;
        const handlerName = log.handler;

        let targetHandler: Agent | undefined;
        let providerName = log.providerName || 'gemini';

        for (const [pName, handlers] of Object.entries(this.chatHandlers)) {
            // If provider is specified in log, only enforce that one
            if (log.providerName && pName !== log.providerName) continue;

            if (handlers[handlerName as AgentName]) {
                targetHandler = handlers[handlerName as AgentName];
                providerName = pName;
                break;
            }
        }

        if (!targetHandler) {
            throw new Error(`No handler found for task type: ${handlerName}`);
        }

        const context: AgentContext = {
            taskType: handlerName as AgentName,
            userId,
            externalCookie,
            providerName,
            saveAssistantMessage: async (content: string, payload?: any) => {
                return this.saveAndEmitAssistantMessage(userId, content, onEvent, payload);
            },
            saveAiResponseLog: async (hName: string, resp: string) => {
                await this.repository.saveAiResponseLog(hName, resp, providerName);
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

        const plan = JSON.parse(responseContent);

        await this.saveAssistantMessage(userId, "Manually triggering action from log...");
        await targetHandler.act(plan, context);
    }
}
