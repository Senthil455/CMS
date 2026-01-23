import type { ChatMessage } from '@cms/shared';

export interface IChatRepository {
    save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
    findAll(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]>;
    saveAiResponseLog(handler: string, response: string): Promise<void>;
    findAllAiResponseLogs(): Promise<any[]>;
    findAiResponseLogById(id: number): Promise<any | null>;
}
