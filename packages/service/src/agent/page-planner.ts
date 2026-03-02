import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, AgentStopError, type AgentPlanResponse } from './chat-assistant';
import { type TemplateSelectionRequest, type PagePlan, SOCKET_EVENTS } from '@cms/shared';
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';

export class PagePlanner implements Agent<TemplateSelectionRequest> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly plannerSystemPrompt: string,
        private readonly logger: ServiceLogger,
        private readonly getTemplateOptions: () => Promise<{ id: string; name: string; description: string }[]>,
        private readonly cmsClient: CmsClient
    ) { }

    async think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<TemplateSelectionRequest>> {
        let schemaId = '';


        // Fetch existing entities to help planner
        const schemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const entityNames = schemas.filter((s: any) => s.type === 'entity').map((s: any) => s.name).filter(Boolean) as string[];
        const existingPageNames = schemas.filter((s: any) => s.type === 'page' && s.settings?.page?.name).map((s: any) => s.settings.page.name) as string[];

        let existingPagePlan: PagePlan | undefined = undefined;
        //todo: system arichitect can not pre assign schemaId
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

        const { plan: pagePlan, developerMessage } = await this.plan(userInput, context, entityNames, existingPageNames, existingPagePlan);

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
            plan: {
                agentTaskItem: context.agentTaskItem,
                userInput,
                selection: context.selection,
                plan: pagePlan,
                templates: templates
            },
            prompts: {
                systemPrompt: this.plannerSystemPrompt,
                developerMessage,
                userInput
            }
        };
    }

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<boolean> {
        const pageType = plan.plan.pageType;
        if (pageType === 'detail') {
            await context.emitEvent(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, plan);
        } else {
            await context.emitEvent(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, plan);
        }

        await context.saveAgentMessage("I have analyzed your request. Please select a design template to proceed with generation.");
        return true;
    }

    private async plan(userInput: string, context: AgentContext, entityNames: string[] = [], existingPageNames: string[] = [], existingPlan?: PagePlan): Promise<{ plan: PagePlan, developerMessage: string }> {
        const entitiesList = entityNames.length > 0 ? entityNames.join(", ") : "None";
        const existingPagesList = existingPageNames.length > 0 ? existingPageNames.join(", ") : "None";

        let developerMessage = `Existing Entities: [${entitiesList}]\nExisting Pages: [${existingPagesList}]\n\nDETERMINE THE PAGE TYPE, RELEVANT ENTITY, AND THE ROUTING STRUCTURE.`;

        if (existingPlan) {
            developerMessage += `\n\nEXISTING ROUTING PLAN:\n${JSON.stringify(existingPlan, null, 2)}\nPreserve the general structure unless changes are requested.`;
        }



        const response = await this.aiProvider.generate(
            this.plannerSystemPrompt,
            developerMessage,
            userInput,
            context?.selection.model,
            context.signal ? { signal: context.signal } : undefined
        );

        try {
            let plan: PagePlan;
            if (typeof response === 'string') {
                plan = JSON.parse(response);
            } else {
                plan = response as PagePlan;
            }
            return { plan, developerMessage };
        } catch (e) {
            this.logger.error({ error: e, response }, 'Failed to parse PagePlanner response');
            throw new AgentStopError("I couldn't understand the plan generated. Please try rephrasing your request.");
        }
    }
}

