import { AgentTaskModel, type AgentTask, type AgentTaskItem } from '../models/agent-task-model';
import type { SystemRequirment, AgentTaskRef } from '@cms/shared';
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

    async checkout(taskId: number): Promise<AgentTaskItem | null> {
        this.logger.info({ taskId }, 'Checking out task item in TaskOperator');
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            this.logger.warn({ taskId }, 'Task not found during checkout');
            return null;
        }

        return this.agentTaskModel.checkout(task);
    }

    async commit(taskRef: AgentTaskRef): Promise<void> {
        this.logger.info({ taskRef }, 'Committing task item in TaskOperator');
        const task = await this.taskRepository.findById(taskRef.taskId);
        if (!task) {
            this.logger.warn({ taskRef }, 'Task not found during commit');
            return;
        }

        if (taskRef.index !== undefined) {
            this.agentTaskModel.commit(task, taskRef.index);
        }

        await this.taskRepository.update(task);
    }

    async reset(taskRef: AgentTaskRef): Promise<void> {
        this.logger.info({ taskRef }, 'Resetting task in TaskOperator');
        const task = await this.taskRepository.findById(taskRef.taskId);
        if (!task) {
            this.logger.warn({ taskRef }, 'Task not found during reset');
            return;
        }

        if (taskRef.index !== undefined) {
            this.agentTaskModel.reset(task, taskRef.index);
        }

        await this.taskRepository.update(task);
    }


    async createTaskFromItems(items: Omit<AgentTaskItem, 'index'>[]): Promise<AgentTask> {
        this.logger.info({ itemCount: items.length }, 'Creating task from items in TaskOperator');
        const task = this.agentTaskModel.createTaskFromItems(items);
        return await this.taskRepository.save(task);
    }

    async insertItemsAfter(taskRef: AgentTaskRef, items: Omit<AgentTaskItem, 'index'>[]): Promise<void> {
        this.logger.info({ taskRef, itemCount: items.length }, 'Inserting items after current index in TaskOperator');
        const task = await this.taskRepository.findById(taskRef.taskId);
        if (!task) {
            this.logger.warn({ taskRef }, 'Task not found during item insertion');
            return;
        }

        this.agentTaskModel.insertItemsAfter(task, taskRef.index, items);
        await this.taskRepository.update(task);
    }
}
