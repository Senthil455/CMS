import type { ChatMessage, SchemaSummary } from '@cms/shared';

export interface ChatContext {
    userId: string;
    externalCookie: string;
    taskType: HandlerType;
    saveAssistantMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    saveAiResponseLog: (handler: string, response: string) => Promise<void>;
    onConfirmSchemaSummary: (summary: SchemaSummary) => Promise<void>;
}

export interface ChatHandler {
    handle(userInput: string, context: ChatContext): Promise<void>;
}

export type HandlerType = 'define_structure' | 'generate_query' | 'design_page' | 'edit_entity' | 'delete_entity' | 'edit_query' | 'delete_query' | 'edit_page' | 'delete_page' | 'list_entities' | 'list_pages' | 'generate_html';