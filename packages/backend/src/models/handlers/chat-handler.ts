import type { ChatMessage, SchemaSummary } from '@cms/shared';

export interface ChatContext {
    userId: string;
    externalCookie: string;
    saveAssistantMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    saveAiResponseLog: (handler: string, response: string) => Promise<void>;
    onConfirmSchemaSummary: (summary: SchemaSummary) => Promise<void>;
}

export interface ChatHandler {
    handle(userInput: string, entityName: string, context: ChatContext): Promise<void>;
}

export type HandlerType = 'list' | 'design';