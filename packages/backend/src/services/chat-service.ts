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

import type { IChatRepository } from '../infrastructures/chat-repository.interface';
import type { ServiceLogger } from '../types/logger';
import type { CmsClient } from '../infrastructures/cms-client';
import { IntentClassifier } from '../models/agents/intent-classifier';
import { EntityManager } from '../models/cms/entity-manager';
import { PageManager } from '../models/cms/page-manager';

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

    async saveAgentMessage(userId: string, content: string, payload?: any): Promise<ChatMessage> {
        return this.repository.save({ userId, content, role: 'assistant', payload });
    }

    async getAiResponseLogs(): Promise<any[]> {
        return this.repository.findAllAiResponseLogs();
    }

    async deleteAiResponseLog(id: number): Promise<void> {
        return this.repository.deleteAiResponseLog(id);
    }

    // Helper method to save and emit assistant messages
    private async saveAndEmitAgentMessage(
        userId: string,
        content: string,
        onEvent: OnServerToClientEvent,
        payload?: any
    ): Promise<ChatMessage> {
        const message = await this.saveAgentMessage(userId, content, payload);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, message);
        return message;
    }

    private createContext(
        userId: string,
        externalCookie: string,
        providerName: string,
        agentName: AgentName,
        onEvent: OnServerToClientEvent,
        schemaId?: string
    ): AgentContext {
        return {
            agentName,
            userId,
            externalCookie,
            providerName,
            ...(schemaId ? { schemaId } : {}),
            saveAgentMessage: async (content: string, payload?: any) => {
                return this.saveAndEmitAgentMessage(userId, content, onEvent, payload);
            },
            saveAiResponseLog: async (handlerName: string, response: string) => {
                await this.repository.saveAiResponseLog(handlerName, response, providerName, schemaId);
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
    }

    private async executeAgent(
        taskType: AgentName,
        userInput: string,
        context: AgentContext
    ): Promise<void> {
        const handler = this.chatHandlers[context.providerName]?.[taskType];
        if (!handler) {
            this.logger.error({ taskType, providerName: context.providerName }, 'Handler not found for task type');
            return;
        }

        this.logger.info({ taskType }, 'Executing handler');

        try {
            // Update context with the specific agent for this execution
            const agentContext = { ...context, agentName: taskType };
            const response = await handler.handle(userInput, agentContext);

            if (response) {
                this.logger.info({ nextAgent: response.nextAgent }, 'Agent requested chaining');
                await this.executeAgent(response.nextAgent, response.nextUserInput, agentContext);
            }
        } catch (error) {
            this.logger.error({ error, taskType }, 'Error executing agent');
            // Error handling is mostly done inside agent.handle via handleAgentError, 
            // but if something bubbles up:
        }
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
        let agent: AgentName | null = null;

        if (content.trim().startsWith('@')) {
            // Check for explicit trigger (e.g. "@entity_generator")
            const explicitTrigger = Object.values(AGENT_NAMES).find(trigger => content.includes(`@${trigger}`));
            if (explicitTrigger) {
                agent = explicitTrigger;
            }
        }

        if (!agent) {
            agent = await this.intentClassifier[providerName]!.resolve(content);
        }

        if (agent) {
            if (this.chatHandlers[providerName]?.[agent]) {
                this.logger.info('Executing resolved handler');

                const context = this.createContext(userId, externalCookie, providerName, agent, onEvent);

                await this.executeAgent(agent, content, context);
                return;
            }

            // Fallback or default behavior if no command resolved
            const aiMessage = await this.saveAgentMessage(userId, "I'm not sure how to help with that. Could you try rephrasing? (Tip: I can help you list, add, edit, or delete entities, or create new ones!)");
            onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, aiMessage);
        }
    }

    async handleSchemaSummaryResponse(userId: string, response: SchemaSummary, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        if (response.entities.length === 0) {
            await this.saveAgentMessage(userId, 'No entities provided to commit.');
            return;
        }

        await this.saveAgentMessage(userId, `Committing ${response.entities.length} entities to CMS...`);

        try {
            const schemaManager = new EntityManager(this.cmsClient, this.logger, externalCookie);
            const schemaIds = await schemaManager.commit(response);
            onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
                task_type: 'entity_generator',
                schemasId: schemaIds
            });
            await this.saveAndEmitAgentMessage(userId, 'All confirmed entities have been successfully committed to CMS. How else can I help?', onEvent);
        } catch (error) {
            this.logger.error({ error }, 'Failed to commit schema changes');
            await this.saveAndEmitAgentMessage(userId, 'I encountered an error while committing your changes. Please check the logs and try again.', onEvent);
        }
    }

    async handleTemplateSelectionResponse(userId: string, response: TemplateSelectionResponse, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {

        const pageManager = new PageManager(this.cmsClient, this.logger, externalCookie);
        const schemaId = await pageManager.savePageTypeAndTemplate(
            response.requestPayload.schemaId,
            response.requestPayload.pageType,
            response.selectedTemplate,
            response.requestPayload.userInput,
            response.enableEngagementBar,
            response.requestPayload.entityName
        );

        const providerName = response.requestPayload.providerName || 'gemini';
        if (this.chatHandlers[providerName]?.[AGENT_NAMES.ROUTER_DESIGNER]) {
            const context = this.createContext(userId, externalCookie, providerName, AGENT_NAMES.ROUTER_DESIGNER, onEvent, schemaId);

            // Pass the entire response as input, RouterDesignerAgent is updated to handle it
            response.requestPayload.schemaId = schemaId;
            // response are saved in the database, no need to pass userInput
            await this.executeAgent(AGENT_NAMES.ROUTER_DESIGNER, '', context);
        } else {
            this.logger.error('RouterDesigner handler not found');
        }
    }
    async actOnLog(logId: number, userId: string, externalCookie: string, onEvent: OnServerToClientEvent, continuePipeline: boolean = false): Promise<void> {
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

        const context = this.createContext(userId, externalCookie, providerName, handlerName as AgentName, onEvent, log.schemaId);

        const plan = JSON.parse(responseContent);

        await this.saveAgentMessage(userId, "Manually triggering action from log...");
        var res = await targetHandler.act(plan, context);
        if (res && continuePipeline) {
            this.executeAgent(res.nextAgent, res.nextUserInput, context);
        }
    }
}
