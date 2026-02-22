import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-agent';
import { type TemplateSelectionRequest, type PagePlan } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';

export class PagePlannerAgent extends BaseAgent<TemplateSelectionRequest> {
    constructor(
        aiProvider: AIProvider,
        private readonly plannerSystemPrompt: string,
        logger: ServiceLogger,
        private readonly templates: Record<string, { id: string, name: string, description: string }[]>,
        private readonly cmsClient: CmsClient
    ) {
        super("generating your page", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<TemplateSelectionRequest> {
        let schemaId = '';


        // Fetch existing entities to help planner
        const schemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const entityNames = schemas.map((s: any) => s.name).filter(Boolean) as string[];

        let existingPagePlan: PagePlan | undefined = undefined;
        if (schemaId) {
            try {
                const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
                if (schema && schema.settings.page && schema.settings.page.metadata) {
                    const metadata = JSON.parse(schema.settings.page.metadata);
                    if (metadata.pagePlan) {
                        existingPagePlan = metadata.pagePlan;
                    }
                }
            } catch (e) {
                this.logger.warn({ schemaId, error: e }, 'Failed to fetch existing schema for routing');
            }
        }

        const pagePlan = await this.plan(userInput, context, entityNames, existingPagePlan);
        await context.saveAgentMessage(`I have determined that you want to create a "${pagePlan.pageType}" page${pagePlan.entityName ? ` for entity "${pagePlan.entityName}"` : ''}. I've also designed a route: ${pagePlan.pageName}`);

        let templates: { id: string, name: string, description: string }[] = [];

        if (pagePlan.pageType === 'detail') {
            templates = this.templates['detail'] || [];
        } else {
            templates = this.templates['list'] || [];
        }

        return {
            userInput,
            schemaId: schemaId,
            providerName: context.providerName,
            plan: pagePlan,
            templates: templates
        };
    }

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<AgentResponse | null> {
        const pageType = plan.plan.pageType;
        if (pageType === 'detail') {
            await context.onTemplateSelectionDetailToConfirm(plan);
        } else {
            await context.onTemplateSelectionListToConfirm(plan);
        }

        await context.saveAgentMessage("I have analyzed your request. Please select a design template to proceed with generation.");
        return null;
    }

    private async plan(userInput: string, context: AgentContext, entityNames: string[] = [], existingPlan?: PagePlan): Promise<PagePlan> {
        const entitiesList = entityNames.length > 0 ? entityNames.join(", ") : "None";

        let developerMessage = `Existing Entities: [${entitiesList}]\n\nDETERMINE THE PAGE TYPE, RELEVANT ENTITY, AND THE ROUTING STRUCTURE.`;

        if (existingPlan) {
            developerMessage += `\n\nEXISTING ROUTING PLAN:\n${JSON.stringify(existingPlan, null, 2)}\nPreserve the general structure unless changes are requested.`;
        }

        const response = await this.aiProvider.generate(
            this.plannerSystemPrompt,
            developerMessage,
            userInput,
            parseModelFromProvider(context.providerName)
        );

        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as PagePlan;
        } catch (e) {
            this.logger.error({ error: e, response }, 'Failed to parse PagePlanner response');
            // Default fallback
            return {
                pageType: 'list',
                entityName: null,
                pageName: `generated-page-${Date.now()}`,

                linkingRules: [],
                primaryParameter: null
            };
        }
    }
}

