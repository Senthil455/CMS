
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, type AgentResponse, handleAgentError } from './chat-agent';
import { AGENT_NAMES, type SaveSchemaPayload, type TemplateSelectionResponse } from '@cms/shared';
import { RouterDesigner, type RoutingPlan } from '../planners/router-designer-planner';
import { PageManager } from '../cms/page-manager';

export class RouterDesignerAgent implements Agent<RoutingPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly routerDesigner: RouterDesigner,
        private readonly cmsClient: CmsClient, // Keep checking schema
        private readonly logger: ServiceLogger
    ) { }

    async think(userInput: string, context: AgentContext): Promise<RoutingPlan> {
        let existingRoutingPlan: any = undefined;
        let actualUserInput = userInput;

        if (context.schemaId) {
            try {
                const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, context.schemaId);
                if (schema && schema.settings.page && schema.settings.page.metadata) {
                    const metadata = JSON.parse(schema.settings.page.metadata);
                    if (metadata.userInput) {
                        actualUserInput = metadata.userInput;
                    }
                    if (metadata.routingPlan) {
                        existingRoutingPlan = metadata.routingPlan;
                    }
                }
            } catch (e) {
                this.logger.warn({ schemaId: context.schemaId, error: e }, 'Failed to fetch existing schema for routing');
            }
        }

        const routingPlan = await this.routerDesigner.plan(actualUserInput, context, existingRoutingPlan);
        return {
            ...routingPlan,
        };
    }

    async act(plan: RoutingPlan, context: AgentContext): Promise<void> {

        const pageManager = new PageManager(this.cmsClient, this.logger, context.externalCookie);
        await pageManager.saveRoutingPlan(context.schemaId!, plan);
        await context.saveAssistantMessage(`I've designed the routing for your page.`);
    }

    async handle(userInput: string, context: AgentContext): Promise<AgentResponse | null> {
        try {
            const plan = await this.think(userInput, context);
            await context.saveAiResponseLog(AGENT_NAMES.ROUTER_DESIGNER, JSON.stringify({ ...plan, taskType: context.taskType }));
            await this.act(plan, context);

            // Chain to Architect
            return {
                nextAgent: AGENT_NAMES.ARCHITECT_DESIGNER,
                nextUserInput: ``//no userInput, next agent can get userInput from context
            };

        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "designing your route", this.aiProvider);
            return null;
        }
    }
}
