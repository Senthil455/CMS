
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent } from './chat-agent';
import { AGENT_NAMES, type SaveSchemaPayload, type TemplateSelectionResponse, type RoutingPlan } from '@cms/shared';
import { RouterDesigner } from '../planners/router-designer-planner';
import { PageManager } from '../cms/page-manager';

export class RouterDesignerAgent extends BaseAgent<RoutingPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly routerDesigner: RouterDesigner,
        private readonly cmsClient: CmsClient, // Keep checking schema
        logger: ServiceLogger
    ) {
        super("designing your route", logger, aiProvider);
    }

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

    async act(plan: RoutingPlan, context: AgentContext): Promise<AgentResponse | null> {

        const pageManager = new PageManager(this.cmsClient, this.logger, context.externalCookie);
        await pageManager.saveRoutingPlan(context.schemaId!, plan);
        await context.saveAgentMessage(`I've designed the routing for your page.`);

        // Chain to Architect
        return {
            nextAgent: AGENT_NAMES.ARCHITECT_DESIGNER,
            nextUserInput: ``//no userInput, next agent can get userInput from context
        };
    }
}
