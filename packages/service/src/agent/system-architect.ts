import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { PrismaClient } from '@prisma/client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, BaseAgent, parseModelFromProvider, AgentStopError } from './chat-assistant';

export interface SystemPlanItem {
    type: 'entity' | 'query' | 'page';
    name: string;
    description: string;
}

export type SystemArchitectPlan = SystemPlanItem[];

export class SystemArchitect extends BaseAgent<SystemArchitectPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly prisma: PrismaClient,
        logger: ServiceLogger
    ) {
        super("architecting your system", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<SystemArchitectPlan> {
        await context.saveAgentMessage(`Analyzing your request and architecting the system components...`);

        const developerMessage = `
Analyze the user's idea and break it down into a list of required entities, queries, and pages.
Output ONLY a JSON array.
        `;

        this.setLastPrompts(this.systemPrompt, developerMessage, userInput);

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput,
            parseModelFromProvider(context.providerName)
        );

        let parsedPlan: SystemArchitectPlan;

        try {
            if (typeof response === 'string') {
                parsedPlan = JSON.parse(response);
            } else {
                parsedPlan = response as unknown as SystemArchitectPlan;
            }
        } catch (e) {
            this.logger.error({ error: e, response }, 'Failed to parse SystemArchitect response');
            parsedPlan = [];
        }

        return parsedPlan;
    }

    async act(plan: SystemArchitectPlan, context: AgentContext): Promise<boolean> {
        if (!plan || plan.length === 0) {
            await context.saveAgentMessage("I couldn't generate a valid plan for this system request.");
            return false;
        }

        try {
            await context.onSystemPlanToConfirm({
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
