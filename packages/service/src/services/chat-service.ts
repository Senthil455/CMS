import {
    SOCKET_EVENTS,
    type ChatMessage,
    type OnServerToClientEvent,
    AGENT_NAMES,
    type AgentName,
    type AgentTaskRef,
    type ModelSelection
} from '@cms/shared';
import { type Agent, type AgentContext } from '../agent/chat-assistant';

import type { IChatMessageRepository } from '../repositories/chat-message-repository';
import type { IAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import type { ServiceLogger } from '../types/logger';
import { IntentClassifier } from '../agent/intent-classifier';
import { TaskOperator } from '../operators/task-operator';
import { StatusService } from './status-service';
import { formatError } from '../utils/error-formatter';
import { UserVisibleError } from '../agent/user-visible-error';
import { CmsError } from '../infrastructures/cms-error';
import { AgentProviderError } from '../infrastructures/agent-provider-error';

/**
 * Payload composed by ChatService when an agent's act() returns non-null feedback.
 * Sent to the frontend via AGENT_PLAN_TO_CONFIRM so the user can review & confirm.
 */
export interface AgentFeedbackPayload<T = any> {
    agentName: AgentName;
    data: T;
    agentTaskItem?: AgentTaskRef;
}

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

        const abortController = new AbortController();
        this.activeRequests.set(userId, abortController);

        try {
            if (content && content.trim().startsWith('@replay')) {
                const replayMatch = content.trim().match(/^@replay\s+(\d+)(\s+--continue)?$/i);
                if (replayMatch && replayMatch[1]) {
                    await this.handleReplayCommand(userId, content, externalCookie, onEvent, replayMatch, abortController.signal);
                    return;
                }
            }

            // Check for modify-component command: @modify-component <schemaId> <componentId> <requirement>
            const modifyMatch = content.trim().match(/^@modify-component\s+([\w-]+)\s+([\w-]+)(?:\s+(.*))?$/is);
            if (modifyMatch) {
                await this.handleModifyComponentCommand(userId, selection, externalCookie, onEvent, modifyMatch, abortController.signal);
                return;
            }

            // Normal message handling
            await this.handleNormalMessage(userId, content, externalCookie, selection, onEvent, abortController.signal);
        } catch (error: any) {
            await this.handleError(userId, error, onEvent);
        } finally {
            this.activeRequests.delete(userId);
        }
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
        const handler = this.resolveHandler(selection, agentName);

        const abortController = new AbortController();
        this.activeRequests.set(userId, abortController);

        try {
            const existingTaskItem: AgentTaskRef | undefined = feedbackData.agentTaskItem;
            const context = this.createContext(userId, externalCookie, undefined, onEvent, abortController.signal);
            const { syncedSchemaIds, followingTaskItems } = await handler.finalize(feedbackData, context);
            this.emitSchemasSync(syncedSchemaIds, agentName, onEvent);

            // Determine the task ref to continue with
            let nextTaskItem: AgentTaskRef | undefined = existingTaskItem;

            if (followingTaskItems && followingTaskItems.length > 0) {
                if (existingTaskItem) {
                    // Insert new items after the current index in the existing task
                    await this.taskOperator.insertItemsAfter(existingTaskItem, followingTaskItems);
                } else {
                    // No existing task — create a new one
                    const task = await this.taskOperator.createTaskFromItems(followingTaskItems);
                    nextTaskItem = { taskId: task.id!, index: -1 };
                }
            }

            // Continue pipeline if there's a pending task item
            if (nextTaskItem) {
                if (existingTaskItem) {
                    await this.taskOperator.commit(existingTaskItem);
                }
                await this.executePendingTaskItem(nextTaskItem.taskId, userId, externalCookie, selection, onEvent, abortController.signal);
            }
        } catch (error: any) {
            await this.handleError(userId, error, onEvent, agentName);
        } finally {
            this.activeRequests.delete(userId);
        }
    }

    private async handleReplayCommand(
        userId: string,
        content: string,
        externalCookie: string,
        onEvent: OnServerToClientEvent,
        replayMatch: RegExpMatchArray,
        signal: AbortSignal
    ): Promise<void> {
        const logId = parseInt(replayMatch[1]!);
        const continuePipeline = !!replayMatch[2];
        // Save user message so it appears in chat
        const userMessage = await this.saveUserMessage(userId, content);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);
        await this.actOnLog(logId, userId, externalCookie, onEvent, signal, continuePipeline);
    }

    private async handleModifyComponentCommand(
        userId: string,
        selection: ModelSelection,
        externalCookie: string,
        onEvent: OnServerToClientEvent,
        modifyMatch: RegExpMatchArray,
        signal: AbortSignal
    ): Promise<void> {
        const schemaId = modifyMatch[1]!;
        const componentId = modifyMatch[2]!;
        const requirement = modifyMatch[3]?.trim() || '';

        const messageText = requirement
            ? `Modify component "${componentId}": ${requirement}`
            : `Modify component "${componentId}"`;
        const userMessage = await this.saveUserMessage(userId, messageText);
        onEvent(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, userMessage);

        const pageBuilder = this.resolveHandler(selection, AGENT_NAMES.PAGE_BUILDER) as any;

        if (pageBuilder && pageBuilder.modifySingleComponent) {
            const context = this.createContext(userId, externalCookie, schemaId, onEvent, signal);
            const syncedSchemaIds = await pageBuilder.modifySingleComponent(componentId, requirement, context);
            this.emitSchemasSync(syncedSchemaIds, AGENT_NAMES.PAGE_BUILDER, onEvent);
        } else {
            throw new UserVisibleError('Page editor is not available. Please try a different AI model.');
        }
    }

    private async handleNormalMessage(
        userId: string,
        content: string,
        externalCookie: string,
        selection: ModelSelection,
        onEvent: OnServerToClientEvent,
        signal: AbortSignal
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
            this.statusService.setStatus(userId, AGENT_NAMES.INTENT_CLASSIFIER, onEvent);
            agent = await this.resolveClassifier(selection)?.resolve(content, this.createContext(userId, externalCookie, undefined, onEvent, signal)) ?? null;
        }

        if (agent && this.resolveHandler(selection, agent)) {
            this.logger.info({ agent }, 'Executing resolved handler');
            const context = this.createContext(userId, externalCookie, undefined, onEvent, signal);
            await this.executeAgent(agent, content, context, selection, userId, onEvent);
            return;
        }

        this.statusService.clearStatus(userId, onEvent);
        // Fallback or default behavior if no command resolved
        const helpMessage = `I'm not sure how to help with that. Could you try rephrasing?\n\nHere are some things I can help you with:\n- **Entity Management**: Create or modify entities, content types, or relationships.\n- **Data Generation**: Generate example content for your entities.\n- **Query Generation**: Create GraphQL queries for your API.\n- **Page Planning**: Design and generate HTML pages.`;
        await this.saveAndEmitAgentMessage(userId, helpMessage, onEvent);
    }

    private async actOnLog(logId: number, userId: string, externalCookie: string,
        onEvent: OnServerToClientEvent, signal: AbortSignal, continuePipeline: boolean = false): Promise<void> {
        const log = await this.logRepository.findAiResponseLogById(logId);
        if (!log) {
            throw new UserVisibleError(`Unable to find the previous action log (ID: ${logId}).`);
        }

        const responseContent = log.response;
        const handlerName = log.handler;

        const selection: ModelSelection = (log.modelSelection || 'gemini/gemini-3-flash') as ModelSelection;
        const context = this.createContext(userId, externalCookie,
            log.schemaId ?? undefined, onEvent, signal);

        let agentTaskItem: AgentTaskRef | undefined;
        if (log.input) {
            const parsedInput = JSON.parse(log.input);
            agentTaskItem = parsedInput.agentTaskItem;
        }


        const plan = JSON.parse(responseContent);
        const handler = this.resolveHandler(selection, handlerName as AgentName)!;
        await this.saveAgentMessage(userId, "Manually triggering action from log...");

        const { feedback, syncedSchemaIds } = await handler.act(plan, context);
        this.emitSchemasSync(syncedSchemaIds, handlerName as AgentName, onEvent);
        if (continuePipeline && agentTaskItem) {
            await this.taskOperator.reset(agentTaskItem);
            if (feedback === null) {
                await this.executePendingTaskItem(agentTaskItem.taskId, userId, context.externalCookie, selection, onEvent, signal);
            }
        }
    }

    private createContext(
        userId: string,
        externalCookie: string,
        schemaId: string | undefined,
        onEvent: OnServerToClientEvent,
        signal?: AbortSignal,
    ): AgentContext {
        return {
            externalCookie,
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
        taskId: number,
        userId: string,
        externalCookie: string,
        selection: ModelSelection,
        onEvent: OnServerToClientEvent,
        signal: AbortSignal
    ): Promise<void> {
        const item = await this.taskOperator.checkout(taskId);
        if (item) {
            const agentTaskItem = { taskId, index: item.index };

            const context = this.createContext(userId, externalCookie,
                item.schemaId, onEvent, signal);
            await this.executeAgent(item.agentName, item.description || '', context, selection, userId, onEvent, agentTaskItem);
        }
    }

    private async executeAgent(
        agentName: AgentName,
        userInput: string,
        context: AgentContext,
        selection: ModelSelection,
        userId: string,
        onEvent: OnServerToClientEvent,
        agentTaskItem?: AgentTaskRef
    ): Promise<void> {
        const handler = this.resolveHandler(selection, agentName);
        if (!handler) {
            this.logger.error({ taskType: agentName, selection }, 'Handler not found for task type');
            return;
        }

        this.statusService.setStatus(userId, agentName, onEvent);
        const agentContext = context;

        // Orchestrator owns the think → log → act pipeline
        const { plan, prompts } = await handler.think(userInput, agentContext);

        // Save AI response log
        const inputLog = JSON.stringify({
            systemPrompt: prompts.systemPrompt || '',
            developerMessage: prompts.developerMessage || '',
            userInput: prompts.userInput || userInput,
            agentTaskItem
        });
        await this.logRepository.saveAiResponseLog(
            agentName,
            JSON.stringify({ ...plan, taskType: agentName }),
            selection,
            context.schemaId,
            inputLog
        );

        const { feedback, syncedSchemaIds } = await handler.act(plan, agentContext);
        this.emitSchemasSync(syncedSchemaIds, agentName, onEvent);
        this.statusService.clearStatus(userId, onEvent);

        if (feedback !== null) {
            // Agent needs user feedback — compose payload and emit unified event
            const feedbackPayload: AgentFeedbackPayload = {
                agentName,
                data: feedback,
                ...(agentTaskItem ? { agentTaskItem } : {}),
            };
            onEvent(SOCKET_EVENTS.CHAT.AGENT_PLAN_TO_CONFIRM, feedbackPayload);
            return; // Wait for user feedback via handleAgentFeedback
        }

        // No feedback needed — commit and continue pipeline
        if (agentTaskItem) {
            await this.taskOperator.commit(agentTaskItem);
            await this.executePendingTaskItem(agentTaskItem.taskId, userId, context.externalCookie, selection, onEvent, context.signal!);
        }
    }

    private async handleError(userId: string, error: any, onEvent: OnServerToClientEvent, agentName?: AgentName): Promise<void> {
        this.statusService.clearStatus(userId, onEvent);


        if (error instanceof UserVisibleError || error instanceof CmsError || error instanceof AgentProviderError) {
            this.logger.error({ error: formatError(error.cause || error), agentName }, 'User visible error');
            await this.saveAndEmitAgentMessage(userId, error.message, onEvent);
            return;
        }

        this.logger.error({ error: formatError(error), agentName }, 'Internal chat service error');
        await this.saveAndEmitAgentMessage(userId, 'I encountered an internal error while processing your request. Please try again later.', onEvent);
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
    private async saveUserMessage(userId: string, content: string): Promise<ChatMessage> {
        return this.messageRepository.save({ userId, content, role: 'user' });
    }

    private async saveAgentMessage(userId: string, content: string, payload?: any): Promise<ChatMessage> {
        return this.messageRepository.save({ userId, content, role: 'assistant', payload });
    }

    private resolveHandler(selection: ModelSelection, agentName: AgentName): Agent {
        if (this.chatHandlers[selection]?.[agentName]) {
            return this.chatHandlers[selection][agentName]!;
        }
        throw new UserVisibleError(`The requested AI agent (${agentName}) is not available for the selected model (${selection}).`);
    }

    private resolveClassifier(selection: ModelSelection): IntentClassifier {
        if (this.intentClassifier[selection]) {
            return this.intentClassifier[selection]!;
        }
        throw new UserVisibleError(`The intent classifier is not available for the selected model (${selection}).`);
    }

}