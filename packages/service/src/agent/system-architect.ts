import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { PrismaClient } from '@prisma/client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type ThinkResult, type Agent, AgentStopError, type ActResult, type FinalizeResult } from './chat-assistant';
import { type SystemRequirment, AGENT_NAMES } from '@cms/shared';

export interface SystemPlanItem {
    type: 'entity' | 'query' | 'page';
    name: string;
    description: string;
}

export type SystemArchitectPlan = SystemPlanItem[];

export class SystemArchitect implements Agent<SystemArchitectPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly prisma: PrismaClient,
        private readonly logger: ServiceLogger,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<SystemArchitectPlan>> {
        const response = await this.aiProvider.generate(
            this.systemPrompt,
            'Generate a system plan identifying the required entities, queries, and pages based on user input.',
            userInput,
            context.signal ? { signal: context.signal } : undefined
        );

        try {
            let plan: SystemArchitectPlan;
            if (typeof response === 'string') {
                plan = JSON.parse(response);
            } else {
                plan = response as SystemArchitectPlan;
            }
            return {
                plan, prompts: {
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

    async act(plan: SystemArchitectPlan, context: AgentContext): Promise<ActResult<SystemArchitectPlan>> {
        if (!plan || plan.length === 0) {
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
                description: `Generate the following entities,\n\n${description}`,
                status: 'pending'
            });
        }

        // Each query => one task item
        for (const item of queryItems) {
            followingTaskItems!.push({
                agentName: AGENT_NAMES.QUERY_BUILDER,
                description: `Generate the following query,\n\tentityName:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });
        }

        // Each page => one task item (page_planner)
        for (const item of pageItems) {
            followingTaskItems!.push({
                agentName: AGENT_NAMES.PAGE_PLANNER,
                description: `Generate the following query,\n\tpage:${item.name}\n\tdescription: ${item.description}`,
                status: 'pending'
            });
        }

        return { syncedSchemaIds: [], followingTaskItems };
    }
}

