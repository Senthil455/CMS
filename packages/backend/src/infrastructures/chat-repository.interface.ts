import type { ChatMessage } from '@cms/shared';

export interface IChatRepository {
    save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
    findAll(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]>;
    saveAiResponseLog(orchestrator: string, response: string): Promise<void>;
    findAllAiResponseLogs(): Promise<any[]>;
}
