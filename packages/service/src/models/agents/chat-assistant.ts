import type { ChatMessage, SchemaSummary, SystemMessagePayload, AgentName, TemplateSelectionRequest } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/ai-provider.interface';

export interface AgentContext {
    userId: string;
    externalCookie: string;
    agentName: AgentName;
    providerName: string;
    schemaId?: string;
    saveAgentMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    saveAiResponseLog: (handler: string, response: string, input?: string) => Promise<void>;
    onConfirmSchemaSummary: (summary: SchemaSummary) => Promise<void>;
    onSchemasSync: (payload: SystemMessagePayload) => Promise<void>;
    onTemplateSelectionListToConfirm: (payload: TemplateSelectionRequest) => Promise<void>;
    onTemplateSelectionDetailToConfirm: (payload: TemplateSelectionRequest) => Promise<void>;
    updateStatus: (content: string) => Promise<void>;
}

export interface AgentResponse {
    nextAgent: AgentName;
    nextUserInput: string;
}

export interface Agent<T = any> {
    think(userInput: string, context: AgentContext): Promise<T>;
    act(plan: T, context: AgentContext): Promise<AgentResponse | null>;
    handle(userInput: string, context: AgentContext): Promise<AgentResponse | null>;
}

import type { ServiceLogger } from '../../types/logger';

export abstract class BaseAgent<T> implements Agent<T> {
    constructor(
        protected readonly actionDescription: string,
        protected readonly logger: ServiceLogger,
        protected readonly aiProvider: AIProvider
    ) { }

    // Agents should set this during think() to capture the full prompt
    protected lastPrompts: { systemPrompt?: string; developerMessage?: string; userInput?: string } = {};

    protected setLastPrompts(systemPrompt: string, developerMessage: string, userInput: string) {
        this.lastPrompts = { systemPrompt, developerMessage, userInput };
    }

    // Abstract methods that subclasses must implement
    abstract think(userInput: string, context: AgentContext): Promise<T>;
    abstract act(plan: T, context: AgentContext): Promise<AgentResponse | null>;

    // Common handle implementation
    async handle(userInput: string, context: AgentContext): Promise<AgentResponse | null> {
        this.logger.info(`${context.agentName} initiated via direct handle call`);
        try {
            const plan = await this.think(userInput, context);

            // Build the full prompt log from what the agent captured
            const inputLog = JSON.stringify({
                systemPrompt: this.lastPrompts.systemPrompt || '',
                developerMessage: this.lastPrompts.developerMessage || '',
                userInput: this.lastPrompts.userInput || userInput,
            });

            await context.saveAiResponseLog(
                context.agentName,
                JSON.stringify({ ...plan, taskType: context.agentName }),
                inputLog
            );

            return await this.act(plan, context);
        } catch (error: any) {
            await handleAgentError(
                error,
                context,
                this.logger,
                this.actionDescription,
                this.aiProvider
            );
            return null;
        }
    }
}

export function parseModelFromProvider(providerName: string): string | undefined {
    const match = providerName.match(/\(([^)]+)\)$/);
    return match ? match[1] : undefined;
}
export async function handleAgentError(error: any, context: AgentContext, logger: any, actionDescription: string, provider?: AIProvider) {
    logger.error({ error, stack: error?.stack }, `Error in ${context.agentName} handle`);

    let errorMessage = error.message || 'Unknown error occurred';

    if (provider && typeof provider.transformError === 'function') {
        errorMessage = provider.transformError(error);
    } else {
        // Fallback for providers that don't implement transformError (though interface says they should)
        // or if provider not passed (legacy/transition)
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
    }

    await context.saveAgentMessage(`I'm sorry, I encountered an error while ${actionDescription}:\n${errorMessage}`);
}