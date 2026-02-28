import { AgentTaskModel, type AgentTask, type AgentTaskItem } from '../models/agent-task-model';
import type { IAgentTaskRepository } from '../repositories/agent-task-repository';
import type { ServiceLogger } from '../types/logger';

export class TaskOperator {
    private readonly agentTaskModel: AgentTaskModel;

    constructor(
        private readonly taskRepository: IAgentTaskRepository,
        private readonly logger: ServiceLogger
    ) {
        this.agentTaskModel = new AgentTaskModel();
    }

    async createPageTask(userInput: string, schemaId?: string): Promise<AgentTask> {
        this.logger.info({ userInput, schemaId }, 'Creating page task in TaskOperator');
        const task = this.agentTaskModel.createPageTask(userInput, schemaId);
        return await this.taskRepository.save(task);
    }

    async checkout(taskId: number): Promise<AgentTaskItem | null> {
        this.logger.info({ taskId }, 'Checking out task item in TaskOperator');
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            this.logger.warn({ taskId }, 'Task not found during checkout');
            return null;
        }

        const firstPendingItem = task.items.find(item => item.status === 'pending');
        if (!firstPendingItem) {
            this.logger.info({ taskId }, 'No pending items found for task');
            return null;
        }

        return firstPendingItem;
    }

    async commit(taskId: number): Promise<void> {
        this.logger.info({ taskId }, 'Committing task item in TaskOperator');
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            this.logger.warn({ taskId }, 'Task not found during commit');
            return;
        }

        const pendingItem = task.items.find(item => item.status === 'pending');
        if (pendingItem) {
            pendingItem.status = 'finished';
        }

        const hasPendingItems = task.items.some(item => item.status === 'pending');
        if (!hasPendingItems) {
            task.status = 'finished';
        }

        await this.taskRepository.update(task);
    }

}
