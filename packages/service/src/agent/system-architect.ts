import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { PrismaClient } from '@prisma/client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type ThinkResult, type Agent, AgentStopError, type ActResult, type FinalizeResult } from './chat-assistant';
import { type SystemRequirment, type SystemRequirmentItem, AGENT_NAMES } from '@cms/shared';

export class SystemArchitect implements Agent<SystemRequirment> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly prisma: PrismaClient,
        private readonly logger: ServiceLogger,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<SystemRequirment>> {
        const response = await this.aiProvider.generate(
            this.systemPrompt,
            'Generate a system plan identifying the required entities, queries, and pages based on user input.',
            userInput,
            context.signal ? { signal: context.signal } : undefined
        );

        try {
            let planItems: SystemRequirmentItem[];
            if (typeof response === 'string') {
                planItems = JSON.parse(response);
            } else {
                planItems = response as SystemRequirmentItem[];
            }
            return {
                plan: { items: planItems }, prompts: {
                    systemPrompt: this.systemPrompt,
                    developerMessage: 'Generate a system plan identifying the required entities, queries, and pages based on user input.',
                    userInput
                }
            };
        } catch (e) {
            this.logger.error({ error: e, response }, 'Failed to parse SystemArchitect response');
            throw new AgentStopError("I couldn't understand the plan generated. Please try rephrasing your request.");
        }
    }

    async act(plan: SystemRequirment, context: AgentContext): Promise<ActResult<SystemRequirment>> {
        if (!plan || !plan.items || plan.items.length === 0) {
            await context.saveAgentMessage("I couldn't generate a valid plan for this system request.");
            return { feedback: null, syncedSchemaIds: [] };
        }

        return { feedback: plan, syncedSchemaIds: [] };
    }

    async finalize(feedbackData: SystemRequirment, _context: AgentContext): Promise<FinalizeResult> {
        const items = feedbackData.items || [];

        const entityItems = items.filter(item => item.type === 'entity');
        const queryItems = items.filter(item => item.type === 'query');
        const pageItems = items.filter(item => item.type === 'page');

        const followingTaskItems: FinalizeResult['followingTaskItems'] = [];

        // All entities => one task item
        if (entityItems.length > 0) {
            const description = entityItems.map(item => `entityName:${item.name}\n\tdescription: ${item.description}`).join('\n\n');
            followingTaskItems!.push({
                agentName: AGENT_NAMES.ENTITY_DESIGNER,
                description: `Generate the entities,\n\n${description}`,
                status: 'pending'
            });
        }

        // Each query => one task item
        for (const item of queryItems) {
            followingTaskItems!.push({
                agentName: AGENT_NAMES.QUERY_BUILDER,
                description: `Generate the query,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });
        }

        // Each page => one task item (page_planner)
        for (const item of pageItems) {
            followingTaskItems!.push({
                agentName: AGENT_NAMES.PAGE_PLANNER,
                description: `Generate the page plan,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });
        }

        return { syncedSchemaIds: [], followingTaskItems };
    }
}

