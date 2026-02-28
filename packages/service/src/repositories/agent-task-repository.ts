import { PrismaClient } from '@prisma/client';
import type { AgentTask, AgentTaskItem } from '../models/agent-task-model';

export interface IAgentTaskRepository {
    save(task: AgentTask): Promise<AgentTask>;
    findById(id: number): Promise<AgentTask | null>;
    update(task: AgentTask): Promise<void>;
    updateStatus(id: number, status: 'pending' | 'finished'): Promise<void>;
}

export class SqliteAgentTaskRepository implements IAgentTaskRepository {
    constructor(private prisma: PrismaClient) { }

    async save(task: AgentTask): Promise<AgentTask> {
        const created = await this.prisma.agentTask.create({
            data: {
                status: task.status,
                items: JSON.stringify(task.items),
            },
        });

        return {
            id: created.id,
            status: created.status as 'pending' | 'finished',
            items: JSON.parse(created.items) as AgentTaskItem[],
        };
    }

    async findById(id: number): Promise<AgentTask | null> {
        const task = await this.prisma.agentTask.findUnique({
            where: { id },
        });

        if (!task) return null;

        return {
            id: task.id,
            status: task.status as 'pending' | 'finished',
            items: JSON.parse(task.items) as AgentTaskItem[],
        };
    }

    async update(task: AgentTask): Promise<void> {
        if (!task.id) throw new Error('Task ID is required for update');
        await this.prisma.agentTask.update({
            where: { id: task.id },
            data: {
                status: task.status,
                items: JSON.stringify(task.items),
            },
        });
    }

    async updateStatus(id: number, status: 'pending' | 'finished'): Promise<void> {
        await this.prisma.agentTask.update({
            where: { id },
            data: { status },
        });
    }
}
