import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { PrismaClient } from '@prisma/client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type AgentPlanResponse, type Agent, AgentStopError } from './chat-assistant';
import type { SystemRequirment } from '@cms/shared';
import { TaskOperator } from '../operators/task-operator';

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
        private readonly taskOperator: TaskOperator,
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

    async act(plan: SystemArchitectPlan, context: AgentContext): Promise<SystemArchitectPlan | null> {
        if (!plan || plan.length === 0) {
            await context.saveAgentMessage("I couldn't generate a valid plan for this system request.");
            return null;
        }

        // Return plan as feedback data — ChatService will compose the payload and emit the event
        return plan;
    }

    async finalize(feedbackData: SystemRequirment, context: AgentContext): Promise<void> {
        const task = await this.taskOperator.createSystemTask(feedbackData);
        context.agentTaskItem = { taskId: task.id!, index: 0 };
    }
}
