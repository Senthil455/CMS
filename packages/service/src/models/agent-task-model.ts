import { ulid } from 'ulid';
import type {
    AgentName,
    SystemRequirment,
} from '@cms/shared';
import { AGENT_NAMES } from '@cms/shared';

export interface AgentTask {
    id?: number;
    status: 'pending' | 'finished';
    items: AgentTaskItem[];
}
export interface AgentTaskItem {
    index: number;
    agentName: AgentName;
    status: 'pending' | 'finished';
    description?: string;
    schemaId?: string | undefined;
}

export class AgentTaskModel {
    private calculateIndices(items: Omit<AgentTaskItem, 'index'>[]): AgentTaskItem[] {
        return items.map((item, index) => ({
            ...item,
            index
        })) as AgentTaskItem[];
    }

    public checkout(task: AgentTask): AgentTaskItem | null {
        return task.items.find(item => item.status === 'pending') || null;
    }

    public commit(task: AgentTask, index: number): void {
        if (task.items[index]) {
            task.items[index].status = 'finished';
        }

        const hasPendingItems = task.items.some(item => item.status === 'pending');
        if (!hasPendingItems) {
            task.status = 'finished';
        }
    }

    public assignNextItemsSchemaId(task: AgentTask, currentIndex: number, schemaId: string, count: number): void {
        for (let i = 1; i <= count; i++) {
            const nextIndex = currentIndex + i;
            if (task.items[nextIndex]) {
                task.items[nextIndex].schemaId = schemaId;
            }
        }
    }

    public reset(task: AgentTask, index: number): void {
        task.items.forEach((item, i) => {
            if (i < index) {
                item.status = 'finished';
            } else {
                item.status = 'pending';
                // Also clear schemaId for items being reset if needed? 
                // Usually reset means retry, so we might want to keep schemaId if it was already assigned
                // for some items, but typically if we reset from an index, we want a fresh start from there.
                // However, the request didn't specifically ask to clear schemaId.
            }
        });

        const hasPendingItems = task.items.some(item => item.status === 'pending');
        task.status = hasPendingItems ? 'pending' : 'finished';
    }
    public createPageTask(userInput: string, schemaId?: string): AgentTask {
        const items = this.calculateIndices([
            {
                agentName: AGENT_NAMES.PAGE_ARCHITECT,
                description: userInput,
                status: 'pending',
                schemaId
            },
            {
                agentName: AGENT_NAMES.PAGE_BUILDER,
                description: userInput,
                status: 'pending',
                schemaId
            }
        ]);

        return {
            status: 'pending',
            items
        };
    } public createSystemTask(requirement: SystemRequirment): AgentTask {
        const entityItems = requirement.items.filter(item => item.type === 'entity');
        const queryItems = requirement.items.filter(item => item.type === 'query');
        const pageItems = requirement.items.filter(item => item.type === 'page');

        const tasks: Omit<AgentTaskItem, 'index'>[] = [];

        // 1. All entities => one task
        if (entityItems.length > 0) {
            const description = entityItems.map(item => `entityName:${item.name}\n\tdescription: ${item.description}`).join('\n\n');
            tasks.push({
                agentName: AGENT_NAMES.ENTITY_DESIGNER,
                description: `Generate the following entities,\n\n${description}`,
                status: 'pending'
            });
        }

        // 2. Each query => one task
        for (const item of queryItems) {
            tasks.push({
                agentName: AGENT_NAMES.QUERY_BUILDER,
                description: `Generate the following query,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });
        }

        // 3. Each page => 3 tasks
        for (const item of pageItems) {
            tasks.push({
                agentName: AGENT_NAMES.PAGE_PLANNER,
                description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });

            tasks.push({
                agentName: AGENT_NAMES.PAGE_ARCHITECT,
                description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });

            tasks.push({
                agentName: AGENT_NAMES.PAGE_BUILDER,
                description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });
        }

        return {
            status: 'pending',
            items: this.calculateIndices(tasks)
        };
    }
}
