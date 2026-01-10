import type { ChatMessage, SchemaSummary, SystemMessagePayload } from '@cms/shared';

export interface ChatContext {
    userId: string;
    externalCookie: string;
    taskType: HandlerType;
    saveAssistantMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    saveAiResponseLog: (handler: string, response: string) => Promise<void>;
    onConfirmSchemaSummary: (summary: SchemaSummary) => Promise<void>;
    onSchemasSync: (payload: SystemMessagePayload) => Promise<void>;
}

export interface ChatHandler {
    handle(userInput: string, context: ChatContext): Promise<void>;
}

export type HandlerType = 'entity_generator' | 'query_generator' | 'page_generator' | 'data_generator';