import { PrismaClient } from '@prisma/client';
import type { AgentTask, AgentTaskItem } from '../models/agent-task-model';

export interface IAgentTaskRepository {
    save(task: AgentTask): Promise<AgentTask>;
    findById(id: number): Promise<AgentTask | null>;
    findLatest(limit: number): Promise<AgentTask[]>;
    update(task: AgentTask): Promise<void>;
    updateStatus(id: number, status: 'pending' | 'finished'): Promise<void>;
}

export class SqliteAgentTaskRepository implements IAgentTaskRepository {
    constructor(private prisma: PrismaClient) { }

    async save(task: AgentTask): Promise<AgentTask> {
        const created = await this.prisma.agentTask.create({
            data: {
                status: task.status,
                ...(task.description !== undefined ? { description: task.description } : {}),
                items: JSON.stringify(task.items),
            },
        });

        const result: AgentTask = {
            id: created.id,
            status: created.status as 'pending' | 'finished',
            items: JSON.parse(created.items) as AgentTaskItem[],
        };
        if (created.description) {
            result.description = created.description;
        }
        return result;
    }

    async findById(id: number): Promise<AgentTask | null> {
        const task = await this.prisma.agentTask.findUnique({
            where: { id },
        });

        if (!task) return null;

        const result: AgentTask = {
            id: task.id,
            status: task.status as 'pending' | 'finished',
            items: JSON.parse(task.items) as AgentTaskItem[],
        };
        if (task.description) {
            result.description = task.description;
        }
        return result;
    }

    async findLatest(limit: number): Promise<AgentTask[]> {
        const tasks = await this.prisma.agentTask.findMany({
            orderBy: { id: 'desc' },
            take: limit,
        });

        return tasks.map(task => {
            const result: AgentTask = {
                id: task.id,
                status: task.status as 'pending' | 'finished',
                items: JSON.parse(task.items) as AgentTaskItem[],
            };
            if (task.description) {
                result.description = task.description;
            }
            return result;
        });
    }

    async update(task: AgentTask): Promise<void> {
        if (!task.id) throw new Error('Task ID is required for update');
        await this.prisma.agentTask.update({
            where: { id: task.id },
            data: {
                status: task.status,
                ...(task.description !== undefined ? { description: task.description } : {}),
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
