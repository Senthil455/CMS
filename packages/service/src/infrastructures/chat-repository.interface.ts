import type { ChatMessage } from '@cms/shared';

export interface IChatRepository {
    save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
    findAll(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]>;
    saveAiResponseLog(handler: string, response: string, providerName?: string, schemaId?: string, input?: string): Promise<void>;
    findAllAiResponseLogs(): Promise<any[]>;
    findAiResponseLogById(id: number): Promise<any | null>;
    deleteAiResponseLog(id: number): Promise<void>;
}
