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
    }

    private calculateIndices(items: Omit<AgentTaskItem, 'index'>[]): AgentTaskItem[] {
        return items.map((item, index) => ({
            ...item,
            index
        })) as AgentTaskItem[];
    }



    public createSystemTask(requirement: SystemRequirment): AgentTask {
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
            const schemaId = ulid();

            tasks.push({
                agentName: AGENT_NAMES.PAGE_PLANNER,
                schemaId,
                description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });

            tasks.push({
                agentName: AGENT_NAMES.PAGE_ARCHITECT,
                schemaId,
                description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });

            tasks.push({
                agentName: AGENT_NAMES.PAGE_BUILDER,
                schemaId,
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
