import { PrismaClient } from '@prisma/client';
import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from '../models/chat-repository.interface';

export class SqliteChatRepository implements IChatRepository {
    constructor(private prisma: PrismaClient) { }

    async save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
        const saved = await this.prisma.chatMessage.create({
            data: {
                userId: message.userId,
                content: message.content,
                role: message.role,
            },
        });
        return {
            ...saved,
            role: saved.role as 'user' | 'assistant',
            createdAt: saved.createdAt.toISOString(),
        };
    }

    async findAll(userId: string): Promise<ChatMessage[]> {
        const messages = await this.prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        return messages.map(m => ({
            ...m,
            role: m.role as 'user' | 'assistant',
            createdAt: m.createdAt.toISOString(),
        }));
    }
}
