import type { ChatMessage } from '@cms/shared';

import { SystemDesigner } from './system-designer';

export interface ChatContext {
    userId: string;
    externalCookie: string;
    saveAssistantMessage: (content: string) => Promise<ChatMessage>;
    saveAiResponseLog: (orchestrator: string, response: string) => Promise<void>;
}

export interface ChatOrchestrator {
    handle(userInput: string, entityName: string, context: ChatContext): Promise<void>;
}

export type CommandType = 'list' | 'add' | 'edit' | 'delete';

export const OrchestratorMap = {
    add: SystemDesigner,
    edit: SystemDesigner,
    delete: SystemDesigner,
    list: SystemDesigner,
}