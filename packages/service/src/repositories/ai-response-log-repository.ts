import { PrismaClient, type AiResponseLog } from '@prisma/client';
import type { ModelSelection } from '@cms/shared';

export interface IAiResponseLogRepository {
    saveAiResponseLog(handler: string, response: string, selection?: ModelSelection,
        schemaId?: string, input?: string): Promise<void>;
    findAllAiResponseLogs(): Promise<AiResponseLog[]>;
    findAiResponseLogById(id: number): Promise<AiResponseLog | null>;
    deleteAiResponseLog(id: number): Promise<void>;
}

export class SqliteAiResponseLogRepository implements IAiResponseLogRepository {
    constructor(private prisma: PrismaClient) { }

    async saveAiResponseLog(handler: string, response: string, selection?: ModelSelection, schemaId?: string, input?: string): Promise<void> {
        let providerName: string | null = null;
        let modelName: string | null = null;

        if (selection) {
            const parts = selection.split('/');
            providerName = parts[0] || null;
            modelName = parts[1] || null;
        }

        await this.prisma.aiResponseLog.create({
            data: {
                handler,
                response,
                providerName,
                modelName,
                schemaId: schemaId || null,
                input: input || null,
            },
        });
    }

    async findAllAiResponseLogs(): Promise<AiResponseLog[]> {
        return this.prisma.aiResponseLog.findMany({
            orderBy: { timestamp: 'desc' },
        });
    }

    async findAiResponseLogById(id: number): Promise<AiResponseLog | null> {
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
