import type { ChatMessage, SchemaSummary, SystemMessagePayload } from '@cms/shared';

export interface ChatContext {
    userId: string;
    externalCookie: string;
    taskType: HandlerType;
    saveAssistantMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    saveAiResponseLog: (handler: string, response: string) => Promise<void>;
    onConfirmSchemaSummary: (summary: SchemaSummary) => Promise<void>;
    onSchemasSync: (payload: SystemMessagePayload) => Promise<void>;
    onTemplateSelectionToConfirm: (payload: any) => Promise<void>;
}

export interface ChatHandler {
    handle(userInput: string, context: ChatContext): Promise<void>;
}

export type HandlerType = 'entity_generator' | 'query_generator' | 'page_generator' | 'data_generator';

export async function handleChatError(error: any, context: ChatContext, logger: any, actionDescription: string) {
    logger.error({ error, stack: error?.stack }, `Error in ${context.taskType} handle`);

    let errorMessage = error.message || 'Unknown error occurred';

    // Handle Gemini 429 Quota Error
    if (errorMessage.includes('Gemini API error 429')) {
        try {
            const jsonPart = errorMessage.substring(errorMessage.indexOf('{'));
            const errorObj = JSON.parse(jsonPart);
            if (errorObj?.error?.message) {
                errorMessage = errorObj.error.message;
            }
        } catch (e) {
            // If parsing fails, just use the original message or a cleaner fallback
            errorMessage = 'You exceeded your current AI quota. Please wait a few seconds and try again.';
        }
    } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
    }

    await context.saveAssistantMessage(`I'm sorry, I encountered an error while ${actionDescription}:\n${errorMessage}`);
}