import type {
    AgentName,
} from '@cms/shared';

export interface AgentTask {
    id?: number;
    status: 'pending' | 'finished';
    description?: string;
    items: AgentTaskItem[];
}
export interface AgentTaskItem {
    index: number;
    agentName: AgentName;
    status: 'pending' | 'finished';
    description?: string;
    schemaId?: string | undefined;
    metadata?: Record<string, any>;
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

    public toggleItemStatus(task: AgentTask, index: number): void {
        console.log(`TOGGLING ITEM index: ${index} in task: ${task.id}`);
        const item = task.items.find(i => i.index === index);
        if (item) {
            const oldStatus = item.status;
            item.status = item.status === 'finished' ? 'pending' : 'finished';
            console.log(`ITEM ${index} STATUS: ${oldStatus} -> ${item.status}`);
        } else {
            console.log(`ITEM ${index} NOT FOUND in task ${task.id}. Available indices: ${task.items.map(i => i.index).join(', ')}`);
        }

        const hasPendingItems = task.items.some(item => item.status === 'pending');
        const oldTaskStatus = task.status;
        task.status = hasPendingItems ? 'pending' : 'finished';
        console.log(`TASK ${task.id} STATUS: ${oldTaskStatus} -> ${task.status}`);
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

    public createTaskFromItems(items: Omit<AgentTaskItem, 'index'>[], description?: string): AgentTask {
        return {
            status: 'pending',
            ...(description !== undefined ? { description } : {}),
            items: this.calculateIndices(items)
        };
    }

    public insertItemsAfter(task: AgentTask, afterIndex: number, items: Omit<AgentTaskItem, 'index'>[]): void {
        const insertAt = afterIndex + 1;
        const newItems = items.map(item => ({ ...item })) as AgentTaskItem[];
        task.items.splice(insertAt, 0, ...newItems);
        // Recalculate all indices
        task.items.forEach((item, i) => { item.index = i; });
        task.status = 'pending';
    }

    public buildWalkthroughMessage(task: AgentTask): string {
        const finishedItems = task.items.filter(item => item.status === 'finished');
        if (finishedItems.length === 0) return 'Task completed.';

        let message = '✅ **Task Complete!**\n\nHere is what I have done:\n\n';
        finishedItems.forEach((item, idx) => {
            const agentLabel = item.agentName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            message += `${idx + 1}. **${agentLabel}** — ${item.description}\n`;
        });
        message += '\nFeel free to ask if you need anything else!';
        return message;
    }
}
