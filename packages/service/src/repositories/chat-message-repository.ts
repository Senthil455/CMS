import { PrismaClient } from '@prisma/client';
import type { ChatMessage } from '@cms/shared';

export interface IChatMessageRepository {
    save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
    findAll(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]>;
}

export class SqliteChatMessageRepository implements IChatMessageRepository {
    constructor(private prisma: PrismaClient) { }

    async save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
        const saved = await this.prisma.chatMessage.create({
            data: {
                userId: message.userId,
                content: message.content,
                role: message.role,
                payload: message.payload ? JSON.stringify(message.payload) : null,
            },
        });
        return {
            ...saved,
            role: saved.role as 'user' | 'assistant',
            createdAt: saved.createdAt.toISOString(),
            payload: saved.payload ? JSON.parse(saved.payload) : undefined,
        };
    }

    async findAll(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]> {
        const where: any = { userId };
        if (beforeId) {
            where.id = { lt: beforeId };
        }

        const messages = await this.prisma.chatMessage.findMany({
            where,
            orderBy: { id: 'desc' },
            take: limit,
        });
        return messages.reverse().map((m: any) => ({
            ...m,
            role: m.role as 'user' | 'assistant',
            createdAt: m.createdAt.toISOString(),
            payload: m.payload ? JSON.parse(m.payload) : undefined,
        }));
    }
}
