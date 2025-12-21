import type { ChatMessage } from '@cms/shared';

export interface IChatRepository {
    save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
    findAll(): Promise<ChatMessage[]>;
}
