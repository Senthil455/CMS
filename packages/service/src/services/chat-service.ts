import {
    SOCKET_EVENTS,
    type ChatMessage,
    type SchemaSummary,
    type OnServerToClientEvent,
    type TemplateSelectionResponse,
    type SystemRequirment,
    AGENT_NAMES,
    type AgentName,
    type AgentTaskRef,
    type ModelSelection
} from '@cms/shared';
import { AgentStopError, type Agent, type AgentContext } from '../agent/chat-assistant';

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
    private activeRequests = new Map<string, AbortController>();
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

    async cancelActiveRequest(userId: string): Promise<boolean> {
        if (this.activeRequests.has(userId)) {
            const controller = this.activeRequests.get(userId)!;
            controller.abort();
            this.activeRequests.delete(userId);
            return true;
        }
        return false;
    }

    async handleUserMessage(
        userId: string,
        content: string,
        externalCookie: string,
        selection: ModelSelection,
        onEvent: OnServerToClientEvent): Promise<void> {
        try {
            // Check for replay command: @replay <logId> [--continue]
            const replayMatch = content.trim().match(/^@replay\s+(\d+)(\s+--continue)?$/i);
            if (replayMatch) {
                await this.handleReplayCommand(userId, content, externalCookie, onEvent, replayMatch);
                return;
            }

            // Check for modify-component command: @modify-component <schemaId> <componentId> <requirement>
            const modifyMatch = content.trim().match(/^@modify-component\s+([\w-]+)\s+([\w-]+)(?:\s+(.*))?$/is);
            if (modifyMatch) {
                await this.handleModifyComponentCommand(userId, selection, externalCookie, onEvent, modifyMatch);
                return;
            }

            // Normal message handling
            await this.handleNormalMessage(userId, content, externalCookie, selection, onEvent);
        } catch (error) {
            this.logger.error({ error: formatError(error) }, 'Error handling user message');

            if (error instanceof UserVisibleError) {
                await this.saveAndEmitAgentMessage(userId, error.message, onEvent);
            } else {
                await this.saveAndEmitAgentMessage(userId, 'I encountered an error while processing your request. Please try again later.', onEvent);
            }
        }
    }

    private async handleReplayCommand(
        userId: string,
        content: string,
        externalCookie: string,
        onEvent: OnServerToClientEvent,
        replayMatch: RegExpMatchArray
    ): Promise<void> {
        const logId = parseInt(replayMatch[1]!);
        const continuePipeline = !!replayMatch[2];
        // Save user message so it appears in chat
        const userMessage = await this.saveUserMessage(userId, content);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);
        await this.actOnLog(logId, userId, externalCookie, onEvent, continuePipeline);
    }

    private async handleModifyComponentCommand(
        userId: string,
        selection: ModelSelection,
        externalCookie: string,
        onEvent: OnServerToClientEvent,
        modifyMatch: RegExpMatchArray
    ): Promise<void> {
        const schemaId = modifyMatch[1]!;
        const componentId = modifyMatch[2]!;
        const requirement = modifyMatch[3]?.trim() || '';

        const messageText = requirement
            ? `Modify component "${componentId}": ${requirement}`
            : `Modify component "${componentId}"`;
        const userMessage = await this.saveUserMessage(userId, messageText);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);

        const pageBuilder = this.chatHandlers[selection.provider]?.[AGENT_NAMES.PAGE_BUILDER] as any;

        if (pageBuilder && pageBuilder.modifySingleComponent) {
            const context = this.createContext(userId, externalCookie, selection,
                AGENT_NAMES.PAGE_BUILDER, schemaId, undefined, onEvent);
            await pageBuilder.modifySingleComponent(componentId, requirement, context);
        } else {
            await this.saveAndEmitAgentMessage(userId, 'Page builder is not available to modify components.', onEvent);
        }
    }

    private async handleNormalMessage(
        userId: string,
        content: string,
        externalCookie: string,
        selection: ModelSelection,
        onEvent: OnServerToClientEvent
    ): Promise<void> {
        // 1. Save and notify user message
        const userMessage = await this.saveUserMessage(userId, content);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);

        // 2. Intent Classifier
        let agent: AgentName | null = null;

        if (content.trim().startsWith('@')) {
            // Check for explicit trigger (e.g. "@entity_designer")
            const explicitTrigger = Object.values(AGENT_NAMES).find(trigger => content.includes(`@${trigger}`));
            if (explicitTrigger) {
                agent = explicitTrigger;
            }
        }

        if (!agent) {
            agent = await this.intentClassifier[selection.provider]?.resolve(content, this.createContext(userId, externalCookie, selection, AGENT_NAMES.INTENT_CLASSIFIER, undefined, undefined, onEvent)) ?? null;
        }

        if (agent && this.chatHandlers[selection.provider]?.[agent]) {
            this.logger.info('Executing resolved handler');
            const abortController = new AbortController();
            this.activeRequests.set(userId, abortController);
            try {
                const context = this.createContext(userId, externalCookie, selection, agent, undefined, undefined, onEvent, abortController.signal);
                await this.executeAgent(agent, content, context, onEvent);
            } finally {
                this.activeRequests.delete(userId);
            }
            return;
        }

        // Fallback or default behavior if no command resolved
        const helpMessage = `I'm not sure how to help with that. Could you try rephrasing?\n\nHere are some things I can help you with:\n- **Entity Management**: Create or modify entities, content types, or relationships.\n- **Data Generation**: Generate example content for your entities.\n- **Query Generation**: Create GraphQL queries for your API.\n- **Page Planning**: Design and generate HTML pages.`;
        const aiMessage = await this.saveAgentMessage(userId, helpMessage);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, aiMessage);
    }

    async handleSchemaSummaryResponse(
        userId: string, response: SchemaSummary, externalCookie: string,
        onEvent: OnServerToClientEvent): Promise<void> {
        if (response.entities.length === 0) {
            await this.saveAgentMessage(userId, 'No entities provided to commit.');
            return;
        }

        await this.saveAgentMessage(userId, `Committing ${response.entities.length} entities to CMS...`);
        let agentTaskItem = response.agentTaskItem;
        try {
            const schemaIds = await this.entityOperator.commit(response, externalCookie);
            onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
                task_type: 'entity_designer',
                schemasId: schemaIds
            });
            await this.saveAndEmitAgentMessage(userId, 'All confirmed entities have been successfully committed to CMS. How else can I help?', onEvent);
            if (agentTaskItem) {
                await this.executePendingTaskItem(agentTaskItem, userId, externalCookie, { provider: 'gemini', model: 'gemini-3-flash' }, onEvent);
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
            let agentTaskItem = response.requestPayload?.agentTaskItem;
            if (!agentTaskItem) {
                const task = await this.taskOperator.createPageTask(response.requestPayload.userInput, schemaId);
                agentTaskItem = { taskId: task.id!, index: 0 }; // Initial item index
            }
            await this.executePendingTaskItem(agentTaskItem, userId, externalCookie, response.requestPayload.selection, onEvent);


        } catch (error: any) {
            this.logger.error({ error: formatError(error) }, 'Error handling template selection response');
            const userMessage = error?.response?.data?.title
                ? `Error: ${error.response.data.title}`
                : 'I encountered an error while setting up the page. Please check the logs and try again.';
            await this.saveAndEmitAgentMessage(userId, userMessage, onEvent);
        }
    }

    async handleSystemPlanResponse(userId: string, response: SystemRequirment, externalCookie: string, onEvent: OnServerToClientEvent): Promise<void> {
        try {
            const task = await this.taskOperator.createSystemTask(response);
            await this.executePendingTaskItem({ taskId: task.id!, index: 0 }, userId, externalCookie, { provider: 'gemini', model: 'gemini-3-flash' }, onEvent);
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
        selection: ModelSelection,
        agentName: AgentName,
        schemaId: string | undefined,
        agentTaskItem: AgentTaskRef | undefined,
        onEvent: OnServerToClientEvent,
        signal?: AbortSignal,
    ): AgentContext {
        return {
            agentTaskItem,
            userId,
            externalCookie,
            agentName,
            selection,
            ...(signal ? { signal } : {}),
            ...(schemaId ? { schemaId } : {}),
            saveAgentMessage: async (content: string, payload?: any) => {
                return this.saveAndEmitAgentMessage(userId, content, onEvent, payload);
            },
            emitEvent: onEvent,
            updateStatus: async (content: string) => {
                this.statusService.updateStatus(userId, content);
            }
        };
    }

    private async executePendingTaskItem(
        agentTaskItem: AgentTaskRef,
        userId: string,
        externalCookie: string,
        selection: ModelSelection,
        onEvent: OnServerToClientEvent
    ): Promise<void> {
        const item = await this.taskOperator.checkout(agentTaskItem.taskId);
        if (item) {
            agentTaskItem = { ...agentTaskItem, index: item.index };

            const abortController = new AbortController();
            this.activeRequests.set(userId, abortController);
            try {
                const context = this.createContext(userId, externalCookie, selection, item.agentName,
                    item.schemaId, agentTaskItem, onEvent, abortController.signal);
                await this.executeAgent(item.agentName, item.description || '', context, onEvent);
            } finally {
                this.activeRequests.delete(userId);
            }
        }
    }

    private async executeAgent(
        taskType: AgentName,
        userInput: string,
        context: AgentContext,
        onEvent: OnServerToClientEvent
    ): Promise<import('../agent/chat-assistant').AgentHandleResponse> {
        const handler = this.chatHandlers[context.selection.provider]?.[taskType];
        if (!handler) {
            this.logger.error({ taskType, provider: context.selection.provider, model: context.selection.model }, 'Handler not found for task type');
            return { needUserFeedback: false };
        }

        this.logger.info({ taskType }, 'Executing handler');
        const agentContext = { ...context, agentName: taskType };

        try {
            // Orchestrator owns the think → log → act pipeline
            const { plan, prompts } = await handler.think(userInput, agentContext);

            // Save AI response log
            const inputLog = JSON.stringify({
                systemPrompt: prompts.systemPrompt || '',
                developerMessage: prompts.developerMessage || '',
                userInput: prompts.userInput || userInput,
                agentTaskItem: context.agentTaskItem
            });
            await this.logRepository.saveAiResponseLog(
                taskType,
                JSON.stringify({ ...plan, taskType }),
                context.selection.provider,
                context.selection.model,
                context.schemaId,
                inputLog
            );

            const needUserFeedback = await handler.act(plan, agentContext);
            this.statusService.clearStatus(context.userId);

            if (context.agentTaskItem) {
                await this.taskOperator.commit(context.agentTaskItem);
            }

            if (context.agentTaskItem && !needUserFeedback) {
                await this.executePendingTaskItem(context.agentTaskItem, context.userId, context.externalCookie, context.selection, onEvent);
            }
            return { needUserFeedback };
        } catch (error: any) {
            this.statusService.clearStatus(context.userId);

            // AgentStopError: agent intentionally stopped — send reason to user
            if (error instanceof AgentStopError) {
                this.logger.info({ agentName: taskType }, `Agent stopped: ${error.userMessage}`);
                await this.saveAndEmitAgentMessage(context.userId, error.userMessage, onEvent);
                return { needUserFeedback: false };
            }

            this.logger.error({ error: formatError(error), taskType }, 'Error executing agent');
            const errorMessage = error.message || 'Unknown error occurred';
            await this.saveAndEmitAgentMessage(
                context.userId,
                `I'm sorry, I encountered an error while processing your request:\n${errorMessage}`,
                onEvent
            );
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

        const selection = { provider: log.providerName || 'gemini', model: log.modelName || 'gemini-3-flash' };
        const context = this.createContext(userId, externalCookie, selection,
            handlerName as AgentName, log.schemaId, log.agentTaskItem, onEvent);

        const plan = JSON.parse(responseContent);

        await this.saveAgentMessage(userId, "Manually triggering action from log...");

        // var res = await targetHandler.act(plan, context);
        // if (res && continuePipeline) {
        //     this.executeAgent(res.nextAgent, res.nextUserInput, context);
        // }
    }
}
