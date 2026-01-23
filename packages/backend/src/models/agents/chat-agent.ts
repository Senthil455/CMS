import type { ChatMessage, SchemaSummary, SystemMessagePayload, AgentTrigger } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/agent.interface';

export interface AgentContext {
    userId: string;
    externalCookie: string;
    taskType: AgentTrigger;
    providerName: string;
    saveAssistantMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    saveAiResponseLog: (handler: string, response: string) => Promise<void>;
    onConfirmSchemaSummary: (summary: SchemaSummary) => Promise<void>;
    onSchemasSync: (payload: SystemMessagePayload) => Promise<void>;
    onTemplateSelectionListToConfirm: (payload: any) => Promise<void>;
    onTemplateSelectionDetailToConfirm: (payload: any) => Promise<void>;
}

export interface Agent<T = any> {
    think(userInput: string, context: AgentContext): Promise<T>;
    act(plan: T, context: AgentContext): Promise<void>;
    handle(userInput: string, context: AgentContext): Promise<void>;
}

export async function handleAgentError(error: any, context: AgentContext, logger: any, actionDescription: string, provider?: AIProvider) {
    logger.error({ error, stack: error?.stack }, `Error in ${context.taskType} handle`);

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

    await context.saveAssistantMessage(`I'm sorry, I encountered an error while ${actionDescription}:\n${errorMessage}`);
}