import { PrismaClient } from '@prisma/client';

export interface ISystemSettingRepository {
    get(key: string): Promise<string | null>;
    upsert(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    getAll(): Promise<Record<string, string>>;
}

export class SqliteSystemSettingRepository implements ISystemSettingRepository {
    constructor(private prisma: PrismaClient) { }

    async get(key: string): Promise<string | null> {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        return setting?.value || null;
    }

    async upsert(key: string, value: string): Promise<void> {
        await this.prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async delete(key: string): Promise<void> {
        await this.prisma.systemSetting.deleteMany({
            where: { key },
        });
    }

    async getAll(): Promise<Record<string, string>> {
        const settings = await this.prisma.systemSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
    }
}
