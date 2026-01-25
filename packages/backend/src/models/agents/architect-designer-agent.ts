
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent } from './chat-agent';
import { AGENT_NAMES, type SaveSchemaPayload } from '@cms/shared';
import { PageArchitect, type PageArchitecturePlan } from '../planners/page-architect-planner';

export interface ArchitectDesignerAgentPlan extends PageArchitecturePlan {
    userInput: string;
    schemaId: string;
}

export class ArchitectDesignerAgent extends BaseAgent<ArchitectDesignerAgentPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly pageArchitect: PageArchitect,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger
    ) {
        super(AGENT_NAMES.ARCHITECT_DESIGNER, "architecting your page", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<ArchitectDesignerAgentPlan> {
        // Extract schemaId
        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new Error("Architecture Designer requires a valid schema ID in context.");
        }

        const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingSchema || !existingSchema.settings?.page?.metadata) {
            throw new Error("Schema not found or missing metadata for architecture planning.");
        }

        const metadata = JSON.parse(existingSchema.settings.page.metadata);
        const routingPlan = metadata.routingPlan;
        const actualUserInput = metadata.userInput || userInput;

        if (!routingPlan) {
            throw new Error("Routing plan not found in page metadata.");
        }

        // Pass pageType from metadata if available to guide architect
        const existingArchitecture = metadata.architecturePlan || {};

        const queries = await this.cmsClient.getAllQueries(context.externalCookie);

        const architecturePlan = await this.pageArchitect.plan(actualUserInput, context, queries, routingPlan, existingArchitecture);

        return {
            ...architecturePlan,
            userInput: actualUserInput,
            schemaId
        };
    }

    async act(plan: ArchitectDesignerAgentPlan, context: AgentContext): Promise<AgentResponse | null> {
        const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, plan.schemaId);
        if (!existingSchema || !existingSchema.settings?.page) throw new Error("Schema not found or missing page settings during Act.");

        const meta = JSON.parse(existingSchema.settings.page.metadata || '{}');

        const payload: SaveSchemaPayload = {
            schemaId: plan.schemaId,
            type: 'page',
            settings: {
                page: {
                    ...existingSchema.settings.page,
                    name: existingSchema.settings.page.name || existingSchema.name, // Ensure name is present
                    metadata: JSON.stringify({
                        ...meta,
                        architecturePlan: plan
                    })
                }
            }
        };

        await this.cmsClient.saveSchema(context.externalCookie, payload);

        await context.saveAssistantMessage(`I've planned the structure and components for your page.`);

        // Chain to HTML Generator
        return {
            nextAgent: AGENT_NAMES.HTML_GENERATOR,
            nextUserInput: ``
        };
    }
}
