import type { ChatMessage } from '@cms/shared';

import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { EntityCreator } from './entity-creator';

export interface ChatContext {
    userId: string;
    externalCookie: string;
    saveAssistantMessage: (content: string) => Promise<ChatMessage>;
    logger: ServiceLogger;
    cmsClient: CmsClient;
}

export interface ChatAgent {
    handle(userInput: string, entityName: string, context: ChatContext): Promise<void>;
}

export type CommandType = 'list' | 'add' | 'edit' | 'delete';

export const AgentMap = {
    add: EntityCreator,
    edit: EntityCreator,
    delete: EntityCreator,
    list: EntityCreator,
}