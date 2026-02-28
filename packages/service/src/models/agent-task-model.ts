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
    type: 'entity' | 'query' | 'page';
    schemaName: string;
    agentName: AgentName;
    status: 'pending' | 'finished';
    description?: string;
    schemaId?: string;
}

export class AgentTaskModel {
    public createPageTask(userInput: string): AgentTask {
        return {
            status: 'pending',
            items: [
                {
                    type: 'page',
                    schemaName: ulid(),
                    agentName: AGENT_NAMES.PAGE_PLANNER,
                    description: userInput,
                    status: 'pending'
                },
                {
                    type: 'page',
                    schemaName: ulid(),
                    agentName: AGENT_NAMES.PAGE_ARCHITECT,
                    description: userInput,
                    status: 'pending'
                },
                {
                    type: 'page',
                    schemaName: ulid(),
                    agentName: AGENT_NAMES.PAGE_BUILDER,
                    description: userInput,
                    status: 'pending'
                }
            ]
        };
    }
    public parse(requirement: SystemRequirment): AgentTask {
        const items: AgentTaskItem[] = [];
        let id = 0;
        for (const item of requirement.entries) {
            if (item.type === 'entity') {
                items.push({
                    type: 'entity',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.ENTITY_DESIGNER,
                    description: `Generate the following entity,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            } else if (item.type === 'query') {
                items.push({
                    type: 'query',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.QUERY_BUILDER,
                    description: `Generate the following query,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            } else if (item.type === 'page') {
                const schemaId = ulid();

                items.push({
                    type: 'page',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.PAGE_PLANNER,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });

                items.push({
                    type: 'page',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.PAGE_ARCHITECT,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });

                items.push({
                    type: 'page',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.PAGE_BUILDER,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            }
        }

        return {
            status: 'pending',
            items
        };
    }
}
