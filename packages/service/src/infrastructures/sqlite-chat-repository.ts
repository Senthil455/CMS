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

    async saveAiResponseLog(handler: string, response: string, providerName?: string, schemaId?: string): Promise<void> {
        await this.prisma.aiResponseLog.create({
            data: {
                handler,
                response,
                providerName: providerName || null,
                schemaId: schemaId || null,
            },
        });
    }

    async findAllAiResponseLogs(): Promise<any[]> {
        return this.prisma.aiResponseLog.findMany({
            orderBy: { timestamp: 'desc' },
        });
    }

    async findAiResponseLogById(id: number): Promise<any | null> {
        return this.prisma.aiResponseLog.findUnique({
            where: { id },
        });
    }

    async deleteAiResponseLog(id: number): Promise<void> {
        await this.prisma.aiResponseLog.delete({
            where: { id },
        });
    }
}
