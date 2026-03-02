import {
    SOCKET_EVENTS,
    type ChatMessage,
    type OnServerToClientEvent,
    AGENT_NAMES,
    type AgentName,
    type AgentTaskRef,
    type ModelSelection
} from '@cms/shared';
import { AgentStopError, type Agent, type AgentContext, type AgentFeedbackPayload } from '../agent/chat-assistant';

import type { IChatMessageRepository } from '../repositories/chat-message-repository';
import type { IAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import type { ServiceLogger } from '../types/logger';
import { IntentClassifier } from '../agent/intent-classifier';
import { TaskOperator } from '../operators/task-operator';
import { StatusService } from './status-service';
import { formatError } from '../utils/error-formatter';
import { UserVisibleError } from '../utils/user-visible-error';

export class ChatService {
    private activeRequests = new Map<string, AbortController>();
    constructor(
        private readonly messageRepository: IChatMessageRepository,
        private readonly logRepository: IAiResponseLogRepository,
        private readonly intentClassifier: Record<string, IntentClassifier>,
        private readonly chatHandlers: Record<string, Partial<Record<AgentName, Agent>>>,
        private readonly statusService: StatusService,
        private readonly logger: ServiceLogger,
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
            const syncedSchemaIds = await pageBuilder.modifySingleComponent(componentId, requirement, context);
            this.emitSchemasSync(syncedSchemaIds, AGENT_NAMES.PAGE_BUILDER, onEvent);
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
                await this.executeAgent(agent, content, context, userId, onEvent);
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

    /**
     * Unified handler for agent feedback responses from the frontend.
     * Replaces handleSchemaSummaryResponse, handleTemplateSelectionResponse, handleSystemPlanResponse.
     */
    async handleAgentFeedback(
        userId: string,
        agentName: AgentName,
        feedbackData: any,
        externalCookie: string,
        selection: ModelSelection,
        onEvent: OnServerToClientEvent
    ): Promise<void> {
        const handler = this.chatHandlers[selection.provider]?.[agentName];
        if (!handler) {
            this.logger.error({ agentName }, 'Handler not found for agent feedback');
            await this.saveAndEmitAgentMessage(userId, 'Unable to process your response. Agent handler not found.', onEvent);
            return;
        }

        try {
            const agentTaskItem = feedbackData.agentTaskItem;
            const context = this.createContext(userId, externalCookie, selection, agentName, undefined, agentTaskItem, onEvent);
            const { syncedSchemaIds } = await handler.finalize(feedbackData, context);
            this.emitSchemasSync(syncedSchemaIds, agentName, onEvent);

            // Continue pipeline if there's a pending task item
            const resolvedTaskItem = context.agentTaskItem;
            if (resolvedTaskItem) {
                await this.taskOperator.commit(resolvedTaskItem);
                await this.executePendingTaskItem(resolvedTaskItem, userId, externalCookie, selection, onEvent);
            }
        } catch (error: any) {
            this.logger.error({ error: formatError(error), agentName }, 'Error handling agent feedback');
            const userMessage = error?.response?.data?.title
                ? `Error: ${error.response.data.title}`
                : 'I encountered an error while processing your confirmation. Please check the logs and try again.';
            await this.saveAndEmitAgentMessage(userId, userMessage, onEvent);
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
            externalCookie,
            agentName,
            selection,
            ...(signal ? { signal } : {}),
            ...(schemaId ? { schemaId } : {}),
            saveAgentMessage: async (content: string, payload?: any) => {
                return this.saveAndEmitAgentMessage(userId, content, onEvent, payload);
            },
        };
    }

    /** Emit SCHEMAS_SYNC if any schemas were modified */
    private emitSchemasSync(syncedSchemaIds: string[], agentName: AgentName, onEvent: OnServerToClientEvent): void {
        if (syncedSchemaIds.length > 0) {
            onEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
                task_type: agentName,
                schemasId: [...syncedSchemaIds]
            });
        }
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
                    undefined, agentTaskItem, onEvent, abortController.signal);
                await this.executeAgent(item.agentName, item.description || '', context, userId, onEvent);
            } finally {
                this.activeRequests.delete(userId);
            }
        }
    }

    private async executeAgent(
        agentName: AgentName,
        userInput: string,
        context: AgentContext,
        userId: string,
        onEvent: OnServerToClientEvent
    ): Promise<void> {
        const handler = this.chatHandlers[context.selection.provider]?.[agentName];
        if (!handler) {
            this.logger.error({ taskType: agentName, provider: context.selection.provider, model: context.selection.model }, 'Handler not found for task type');
            return;
        }

        this.statusService.updateStatus(userId, 'executing ' + agentName);
        const agentContext = { ...context, agentName: agentName };

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
                agentName,
                JSON.stringify({ ...plan, taskType: agentName }),
                context.selection.provider,
                context.selection.model,
                context.schemaId,
                inputLog
            );

            const { feedback, syncedSchemaIds } = await handler.act(plan, agentContext);
            this.emitSchemasSync(syncedSchemaIds, agentName, onEvent);
            this.statusService.clearStatus(userId);

            if (feedback !== null) {
                // Agent needs user feedback — compose payload and emit unified event
                const feedbackPayload: AgentFeedbackPayload = {
                    agentName,
                    data: feedback,
                    ...(context.agentTaskItem ? { agentTaskItem: context.agentTaskItem } : {}),
                };
                onEvent(SOCKET_EVENTS.CHAT.AGENT_PLAN_TO_CONFIRM, feedbackPayload);
                return; // Wait for user feedback via handleAgentFeedback
            }

            // No feedback needed — commit and continue pipeline
            if (context.agentTaskItem) {
                await this.taskOperator.commit(context.agentTaskItem);
            }

            if (context.agentTaskItem) {
                await this.executePendingTaskItem(context.agentTaskItem, userId, context.externalCookie, context.selection, onEvent);
            }
        } catch (error: any) {
            this.statusService.clearStatus(userId);

            // AgentStopError: agent intentionally stopped — send reason to user
            if (error instanceof AgentStopError) {
                this.logger.info({ agentName: agentName }, `Agent stopped: ${error.userMessage}`);
                await this.saveAndEmitAgentMessage(userId, error.userMessage, onEvent);
                return;
            }

            this.logger.error({ error: formatError(error), taskType: agentName }, 'Error executing agent');
            const errorMessage = error.message || 'Unknown error occurred';
            await this.saveAndEmitAgentMessage(
                userId,
                `I'm sorry, I encountered an error while processing your request:\n${errorMessage}`,
                onEvent
            );
        }
    }

    private async actOnLog(logId: number, userId: string, externalCookie: string,
        onEvent: OnServerToClientEvent, continuePipeline: boolean = false): Promise<void> {
        const log = await this.logRepository.findAiResponseLogById(logId);
        if (!log) {
            throw new Error(`Log with ID ${logId} not found`);
        }

        const responseContent = log.response;
        const handlerName = log.handler;

        const selection = { provider: log.providerName, model: log.modelName };
        const context = this.createContext(userId, externalCookie, selection,
            handlerName as AgentName, log.schemaId, log.agentTaskItem, onEvent);

        const plan = JSON.parse(responseContent);
        const handler = this.chatHandlers[selection.provider]?.[handlerName as AgentName]!;
        await this.saveAgentMessage(userId, "Manually triggering action from log...");

        const { feedback, syncedSchemaIds } = await handler.act(plan, context);
        this.emitSchemasSync(syncedSchemaIds, handlerName as AgentName, onEvent);
        if (continuePipeline && context.agentTaskItem) {
            await this.taskOperator.reset(context.agentTaskItem);
            if (feedback === null) {
                await this.executePendingTaskItem(context.agentTaskItem, userId, context.externalCookie, context.selection, onEvent);
            }
        }
    }
}
