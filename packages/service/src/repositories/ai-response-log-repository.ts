import { PrismaClient } from '@prisma/client';

export interface IAiResponseLogRepository {
    saveAiResponseLog(handler: string, response: string, providerName?: string, modelName?: string,
        schemaId?: string, input?: string): Promise<void>;
    findAllAiResponseLogs(): Promise<any[]>;
    findAiResponseLogById(id: number): Promise<any | null>;
    deleteAiResponseLog(id: number): Promise<void>;
}

export class SqliteAiResponseLogRepository implements IAiResponseLogRepository {
    constructor(private prisma: PrismaClient) { }

    async saveAiResponseLog(handler: string, response: string, providerName?: string, modelName?: string, schemaId?: string, input?: string): Promise<void> {
        await this.prisma.aiResponseLog.create({
            data: {
                handler,
                response,
                providerName: providerName || null,
                modelName: modelName || null,
                schemaId: schemaId || null,
                input: input || null,
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
