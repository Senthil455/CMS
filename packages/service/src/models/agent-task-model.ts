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
    agentName: AgentName;
    status: 'pending' | 'finished';
    description?: string;
    schemaId?: string | undefined;
}

export class AgentTaskModel {
    public createPageTask(userInput: string, schemaId?: string): AgentTask {
        return {
            status: 'pending',
            items: [
                {
                    type: 'page',
                    agentName: AGENT_NAMES.PAGE_ARCHITECT,
                    description: userInput,
                    status: 'pending',
                    schemaId
                },
                {
                    type: 'page',
                    agentName: AGENT_NAMES.PAGE_BUILDER,
                    description: userInput,
                    status: 'pending',
                    schemaId
                }
            ]
        };
    }

    public createEntityTask(userInput: string, schemaId?: string): AgentTask {
        return {
            status: 'pending',
            items: [
                {
                    type: 'entity',
                    agentName: AGENT_NAMES.ENTITY_DESIGNER,
                    description: userInput,
                    status: 'pending',
                    schemaId
                }
            ]
        };
    }

    public createSystemTask(requirement: SystemRequirment): AgentTask {
        const items: AgentTaskItem[] = [];
        for (const item of requirement.entries) {
            if (item.type === 'entity') {
                items.push({
                    type: 'entity',
                    agentName: AGENT_NAMES.ENTITY_DESIGNER,
                    description: `Generate the following entity,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            } else if (item.type === 'query') {
                items.push({
                    type: 'query',
                    agentName: AGENT_NAMES.QUERY_BUILDER,
                    description: `Generate the following query,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            } else if (item.type === 'page') {
                const schemaId = ulid();

                items.push({
                    type: 'page',
                    agentName: AGENT_NAMES.PAGE_PLANNER,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });

                items.push({
                    type: 'page',
                    agentName: AGENT_NAMES.PAGE_ARCHITECT,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });

                items.push({
                    type: 'page',
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
