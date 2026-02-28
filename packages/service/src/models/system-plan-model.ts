import { ulid } from 'ulid';
import type {
    SystemRequirment,
    SystemImplementationTask
} from '@cms/shared';
import { AGENT_NAMES } from '@cms/shared';

export class SystemPlanModel {
    public add(requirement: SystemRequirment): SystemImplementationTask[] {
        const tasks: SystemImplementationTask[] = [];

        for (const item of requirement.entries) {
            if (item.type === 'entity') {
                tasks.push({
                    planId: requirement.id,
                    type: 'entity',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.ENTITY_DESIGNER,
                    taskId: item.name,
                    description: `Generate the following entity,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            } else if (item.type === 'query') {
                tasks.push({
                    planId: requirement.id,
                    type: 'query',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.QUERY_BUILDER,
                    description: `Generate the following query,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            } else if (item.type === 'page') {
                const schemaId = ulid();

                tasks.push({
                    planId: requirement.id,
                    type: 'page',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.PAGE_PLANNER,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });

                tasks.push({
                    planId: requirement.id,
                    type: 'page',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.PAGE_ARCHITECT,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });

                tasks.push({
                    planId: requirement.id,
                    type: 'page',
                    schemaName: item.name,
                    agentName: AGENT_NAMES.PAGE_BUILDER,
                    schemaId,
                    description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                    status: 'pending'
                });
            }
        }

        return tasks;
    }
}
