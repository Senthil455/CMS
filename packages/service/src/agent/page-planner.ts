import type { ServiceLogger } from '../types/logger';
import { type AgentContext, BaseAgent, AgentStopError, parseModelFromProvider } from './chat-assistant';
import { type TemplateSelectionRequest, type PagePlan } from '@cms/shared';
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';

export class PagePlanner extends BaseAgent<TemplateSelectionRequest> {
    constructor(
        aiProvider: AIProvider,
        private readonly plannerSystemPrompt: string,
        logger: ServiceLogger,
        private readonly getTemplateOptions: () => Promise<{ id: string; name: string; description: string }[]>,
        private readonly cmsClient: CmsClient
    ) {
        super("generating your page", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<TemplateSelectionRequest> {
        let schemaId = '';


        // Fetch existing entities to help planner
        const schemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const entityNames = schemas.filter((s: any) => s.type === 'entity').map((s: any) => s.name).filter(Boolean) as string[];
        const existingPageNames = schemas.filter((s: any) => s.type === 'page' && s.settings?.page?.name).map((s: any) => s.settings.page.name) as string[];

        let existingPagePlan: PagePlan | undefined = undefined;
        if (schemaId) {
            try {
                const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
                if (schema && schema.settings.page && schema.settings.page.metadata) {
                    const metadata = schema.settings.page.metadata;
                    if (metadata.plan) {
                        existingPagePlan = metadata.plan;
                    }
                }
            } catch (e) {
                this.logger.warn({ schemaId, error: e }, 'Failed to fetch existing schema for routing');
            }
        }

        const pagePlan = await this.generateRoutingPlan(userInput, context, entityNames, existingPageNames, existingPagePlan);

        // If the planner couldn't match an entity, stop the pipeline
        if (!pagePlan.entityName) {
            const reason = (pagePlan as any).reason || 'No matching entity was found for your request.';
            throw new AgentStopError(reason);
        }

        await context.saveAgentMessage(`I have determined that you want to create a "${pagePlan.pageType}" page${pagePlan.entityName ? ` for entity "${pagePlan.entityName}"` : ''}. I've also designed a route: ${pagePlan.pageName}`);

        // Load templates from DB and prepend "No Style" option
        const dbTemplates = await this.getTemplateOptions();
        const noStyleOption = { id: '', name: 'No Style', description: 'Generate without a specific design template. The AI will use its own judgement.' };
        const templates = [noStyleOption, ...dbTemplates];

        return {
            taskId: context.taskId || undefined,
            userInput,
            schemaId: pagePlan.pageName,
            providerName: context.providerName,
            plan: pagePlan,
            templates: templates
        };
    }

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<boolean> {
        const pageType = plan.plan.pageType;
        if (pageType === 'detail') {
            await context.onTemplateSelectionDetailToConfirm(plan);
        } else {
            await context.onTemplateSelectionListToConfirm(plan);
        }

        await context.saveAgentMessage("I have analyzed your request. Please select a design template to proceed with generation.");
        return true;
    }

    private async generateRoutingPlan(userInput: string, context: AgentContext, entityNames: string[] = [], existingPageNames: string[] = [], existingPlan?: PagePlan): Promise<PagePlan> {
        const entitiesList = entityNames.length > 0 ? entityNames.join(", ") : "None";
        const existingPagesList = existingPageNames.length > 0 ? existingPageNames.join(", ") : "None";

        let developerMessage = `Existing Entities: [${entitiesList}]\nExisting Pages: [${existingPagesList}]\n\nDETERMINE THE PAGE TYPE, RELEVANT ENTITY, AND THE ROUTING STRUCTURE.`;

        if (existingPlan) {
            developerMessage += `\n\nEXISTING ROUTING PLAN:\n${JSON.stringify(existingPlan, null, 2)}\nPreserve the general structure unless changes are requested.`;
        }

        this.setLastPrompts(this.plannerSystemPrompt, developerMessage, userInput);

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
            throw new AgentStopError("I couldn't understand the plan generated. Please try rephrasing your request.");
        }
    }
}

