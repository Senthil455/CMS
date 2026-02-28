import {
    SOCKET_EVENTS,
    type ChatMessage,
    type SchemaSummary,
    type OnServerToClientEvent,
    type TemplateSelectionResponse,
    type SystemRequirmentConfirmationDto,
    AGENT_NAMES,
    type AgentName
} from '@cms/shared';
import type { Agent, AgentContext } from '../agent/chat-assistant';

import type { IChatMessageRepository } from '../repositories/chat-message-repository';
import type { IAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import type { ServiceLogger } from '../types/logger';
import { IntentClassifier } from '../agent/intent-classifier';
import { EntityOperator } from '../operators/entity-operator';
import { PageOperator } from '../operators/page-operator';
import { TaskOperator } from '../operators/task-operator';
import { StatusService } from './status-service';
import { formatError } from '../utils/error-formatter';
import { UserVisibleError } from '../utils/user-visible-error';
import { config } from '../config';

export class ChatService {
    constructor(
        private readonly messageRepository: IChatMessageRepository,
        private readonly logRepository: IAiResponseLogRepository,
        private readonly intentClassifier: Record<string, IntentClassifier>,
        private readonly chatHandlers: Record<string, Partial<Record<AgentName, Agent>>>,
        private readonly statusService: StatusService,
        private readonly logger: ServiceLogger,
        private readonly entityOperator: EntityOperator,
        private readonly pageOperator: PageOperator,
        private readonly taskOperator: TaskOperator,
    ) { }

    async handleUserMessage(
        userId: string,
        content: string,
        externalCookie: string,
        providerName: string,
        onEvent: OnServerToClientEvent): Promise<void> {
        try {
            // Check for replay command: @replay <logId> [--continue]
            const replayMatch = content.trim().match(/^@replay\s+(\d+)(\s+--continue)?$/i);
            if (replayMatch) {
                const logId = parseInt(replayMatch[1]!);
                const continuePipeline = !!replayMatch[2];
                // Save user message so it appears in chat
                const userMessage = await this.saveUserMessage(userId, content);
                onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);
                await this.actOnLog(logId, userId, externalCookie, onEvent, continuePipeline);
                return;
            }

            // Check for modify-component command: @modify-component <schemaId> <componentId> <requirement>
            const modifyMatch = content.trim().match(/^@modify-component\s+([\w-]+)\s+([\w-]+)(?:\s+(.*))?$/is);
            if (modifyMatch) {
                const schemaId = modifyMatch[1]!;
                const componentId = modifyMatch[2]!;
                const requirement = modifyMatch[3]?.trim() || '';

                const messageText = requirement
                    ? `Modify component "${componentId}": ${requirement}`
                    : `Modify component "${componentId}"`;
                const userMessage = await this.saveUserMessage(userId, messageText);
                onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);

                const baseProviderName = providerName.split(' ')[0] || providerName;
                const pageBuilder = this.chatHandlers[baseProviderName]?.[AGENT_NAMES.PAGE_BUILDER] as any;

                if (pageBuilder && pageBuilder.modifySingleComponent) {
                    const context = this.createContext(userId, externalCookie, providerName, AGENT_NAMES.PAGE_BUILDER, onEvent, schemaId);
                    await pageBuilder.modifySingleComponent(componentId, requirement, context);
                } else {
                    await this.saveAndEmitAgentMessage(userId, 'Page builder is not available to modify components.', onEvent);
                }
                return;
            }

            // 1. Save and notify user message
            const userMessage = await this.saveUserMessage(userId, content);
            onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);

            // Extract base provider from "provider (model)" format
            const baseProviderName = providerName.split(' ')[0] || providerName;

            // 2. Intent Classifier
            let agent: AgentName | null = null;

            if (content.trim().startsWith('@')) {
                // Check for explicit trigger (e.g. "@entity_designer")
                const explicitTrigger = Object.values(AGENT_NAMES).find(trigger => content.includes(`@${trigger}`));
                if (explicitTrigger) {
                    agent = explicitTrigger;
                }
            }


            if (agent && this.chatHandlers[baseProviderName]?.[agent]) {
                this.logger.info('Executing resolved handler');
                const context = this.createContext(userId, externalCookie, providerName, agent, onEvent);
                await this.executeAgent(agent, content, context, onEvent);
                return;
            }

            // Fallback or default behavior if no command resolved
            const helpMessage = `I'm not sure how to help with that. Could you try rephrasing?\n\nHere are some things I can help you with:\n- **Entity Management**: Create or modify entities, content types, or relationships.\n- **Data Generation**: Generate example content for your entities.\n- **Query Generation**: Create GraphQL queries for your API.\n- **Page Planning**: Design and generate HTML pages.`;
            const aiMessage = await this.saveAgentMessage(userId, helpMessage);
            onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, aiMessage);
        } catch (error) {
            this.logger.error({ error: formatError(error) }, 'Error handling user message');

            if (error instanceof UserVisibleError) {
                await this.saveAndEmitAgentMessage(userId, error.message, onEvent);
            } else {
                await this.saveAndEmitAgentMessage(userId, 'I encountered an error while processing your request. Please try again later.', onEvent);
            }
        }
    }

    async handleSchemaSummaryResponse(userId: string, response: SchemaSummary, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        if (response.entities.length === 0) {
            await this.saveAgentMessage(userId, 'No entities provided to commit.');
            return;
        }

        await this.saveAgentMessage(userId, `Committing ${response.entities.length} entities to CMS...`);
        let taskId = response.taskId;
        try {
            const schemaIds = await this.entityOperator.commit(response, externalCookie);
            onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
                task_type: 'entity_designer',
                schemasId: schemaIds
            });
            await this.saveAndEmitAgentMessage(userId, 'All confirmed entities have been successfully committed to CMS. How else can I help?', onEvent);
            if (taskId) {
                await this.executePendingTaskItem(taskId, userId, externalCookie, 'gemini', onEvent);
            }
        } catch (error) {
            this.logger.error({ error: formatError(error) }, 'Failed to commit schema changes');
            await this.saveAndEmitAgentMessage(userId, 'I encountered an error while committing your changes. Please check the logs and try again.', onEvent);
        }
    }


    async handleTemplateSelectionResponse(userId: string, response: TemplateSelectionResponse, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        try {
            const schemaId = await this.pageOperator.savePlanAndUserInput(
                response.requestPayload.schemaId,
                response.requestPayload.plan,
                response.selectedTemplate,
                response.requestPayload.userInput,
                externalCookie
            );
            let taskId = response.requestPayload.taskId;
            if (!taskId) {
                taskId = (await this.taskOperator.createPageTask(response.requestPayload.userInput, schemaId)).id;
            }
            await this.executePendingTaskItem(taskId!, userId, externalCookie, response.requestPayload.providerName || 'gemini', onEvent);


        } catch (error: any) {
            this.logger.error({ error: formatError(error) }, 'Error handling template selection response');
            const userMessage = error?.response?.data?.title
                ? `Error: ${error.response.data.title}`
                : 'I encountered an error while setting up the page. Please check the logs and try again.';
            await this.saveAndEmitAgentMessage(userId, userMessage, onEvent);
        }
    }

    async handleSystemPlanResponse(userId: string, response: SystemRequirmentConfirmationDto, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        try {
            const task = await this.taskOperator.createSystemTask(response);
            await this.executePendingTaskItem(task.id!, userId, externalCookie, config.AI_PROVIDER, onEvent);
        } catch (error: any) {
            this.logger.error({ error: formatError(error) }, 'Error handling system plan response');
            await this.saveAndEmitAgentMessage(userId, 'I encountered an error while saving the system plan. Please check the logs and try again.', onEvent);
            this.statusService.clearStatus(userId);
        }
    }

    private async saveUserMessage(userId: string, content: string): Promise<ChatMessage> {
        return this.messageRepository.save({ userId, content, role: 'user' });
    }

    private async saveAgentMessage(userId: string, content: string, payload?: any): Promise<ChatMessage> {
        return this.messageRepository.save({ userId, content, role: 'assistant', payload });
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
            saveAiResponseLog: async (handlerName: string, response: string, input?: string) => {
                await this.logRepository.saveAiResponseLog(handlerName, response, providerName, schemaId, input);
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
            },
            onSystemPlanToConfirm: async (data: SystemRequirmentConfirmationDto) => {
                onEvent(SOCKET_EVENTS.CHAT.SYSTEM_PLAN_TO_CONFIRM, data);
            },
            updateStatus: async (content: string) => {
                this.statusService.updateStatus(userId, content);
            }
        };
    }

    private async executePendingTaskItem(
        taskId: number,
        userId: string,
        externalCookie: string,
        providerName: string,
        onEvent: OnServerToClientEvent
    ): Promise<void> {
        const item = await this.taskOperator.checkout(taskId);
        if (item) {
            const context = this.createContext(userId, externalCookie, providerName, item.agentName, onEvent, item.schemaId);
            context.taskId = taskId;
            await this.executeAgent(item.agentName, item.description || '', context, onEvent);
        }
    }

    private async executeAgent(
        taskType: AgentName,
        userInput: string,
        context: AgentContext,
        onEvent: OnServerToClientEvent
    ): Promise<import('../agent/chat-assistant').AgentHandleResponse> {
        const baseProviderName = context.providerName.split(' ')[0] || context.providerName;
        const handler = this.chatHandlers[baseProviderName]?.[taskType];
        if (!handler) {
            this.logger.error({ taskType, providerName: context.providerName, baseProviderName }, 'Handler not found for task type');
            return { needUserFeedback: false };
        }

        this.logger.info({ taskType }, 'Executing handler');

        try {
            // Update context with the specific agent for this execution
            const agentContext = { ...context, agentName: taskType };
            const response = await handler.handle(userInput, agentContext);

            if (context.taskId) {
                await this.taskOperator.commit(context.taskId);
            }

            if (context.taskId && !response.needUserFeedback) {
                await this.executePendingTaskItem(context.taskId, context.userId, context.externalCookie, context.providerName, onEvent);
            }
            return response;
        } catch (error) {
            this.statusService.clearStatus(context.userId);
            this.logger.error({ error: formatError(error), taskType }, 'Error executing agent');
            return { needUserFeedback: false };
        }
    }

    private async actOnLog(logId: number, userId: string, externalCookie: string, onEvent: OnServerToClientEvent, continuePipeline: boolean = false): Promise<void> {
        const log = await this.logRepository.findAiResponseLogById(logId);
        if (!log) {
            throw new Error(`Log with ID ${logId} not found`);
        }

        const responseContent = log.response;
        const handlerName = log.handler;

        let targetHandler: Agent | undefined;
        let providerName = log.providerName || 'gemini';
        let baseProviderName = providerName.split(' ')[0] || providerName;

        for (const [pName, handlers] of Object.entries(this.chatHandlers)) {
            // If provider is specified in log, only enforce that one
            if (log.providerName && pName !== baseProviderName) continue;

            if (handlers[handlerName as AgentName]) {
                targetHandler = handlers[handlerName as AgentName];
                break;
            }
        }

        if (!targetHandler) {
            throw new Error(`No handler found for task type: ${handlerName}`);
        }

        const context = this.createContext(userId, externalCookie, providerName, handlerName as AgentName, onEvent, log.schemaId);

        const plan = JSON.parse(responseContent);

        await this.saveAgentMessage(userId, "Manually triggering action from log...");
        // var res = await targetHandler.act(plan, context);
        // if (res && continuePipeline) {
        //     this.executeAgent(res.nextAgent, res.nextUserInput, context);
        // }
    }
}
