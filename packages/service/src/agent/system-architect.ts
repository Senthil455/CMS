import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { PrismaClient } from '@prisma/client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type AgentPlanResponse, type Agent, AgentStopError } from './chat-assistant';
import { SOCKET_EVENTS } from '@cms/shared';

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
        private readonly logger: ServiceLogger
    ) { }

    async think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<SystemArchitectPlan>> {
        const response = await this.aiProvider.generate(
            this.systemPrompt,
            'Generate a system plan identifying the required entities, queries, and pages based on user input.',
            userInput,
            context?.selection.model,
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

    async act(plan: SystemArchitectPlan, context: AgentContext): Promise<boolean> {
        if (!plan || plan.length === 0) {
            await context.saveAgentMessage("I couldn't generate a valid plan for this system request.");
            return false;
        }

        try {
            await context.emitEvent(SOCKET_EVENTS.CHAT.SYSTEM_PLAN_TO_CONFIRM, {
                items: plan
            } as any);
            throw new AgentStopError("Please review the generated system plan, then confirm what to build.");
        } catch (error) {
            // Re-throw AgentStopError so handle() can process it properly
            if (error instanceof AgentStopError) {
                throw error;
            }
            this.logger.error({ error }, 'Failed to emit system plan for confirmation');
            await context.saveAgentMessage("I generated the plan but failed to send it for your confirmation.");
            return false;
        }
    }
}
