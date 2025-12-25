import { PrismaClient } from '@prisma/client';
import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from './chat-repository.interface';

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
        return messages.reverse().map(m => ({
            ...m,
            role: m.role as 'user' | 'assistant',
            createdAt: m.createdAt.toISOString(),
        }));
    }

    async saveAiResponseLog(orchestrator: string, response: string): Promise<void> {
        await this.prisma.aiResponseLog.create({
            data: {
                orchestrator,
                response,
            },
        });
    }

    async findAllAiResponseLogs(): Promise<any[]> {
        return this.prisma.aiResponseLog.findMany({
            orderBy: { timestamp: 'desc' },
        });
    }
}
