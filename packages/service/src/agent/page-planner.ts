import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, type ThinkResult, type ActResult, type FinalizeResult } from './chat-assistant';
import { UserVisibleError } from './user-visible-error';
import { type TemplateSelectionRequest, type TemplateSelectionResponse, type PagePlan, AGENT_NAMES } from '@cms/shared';
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import { PageOperator } from '../operators/page-operator';

export class PagePlanner implements Agent<TemplateSelectionRequest> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly plannerSystemPrompt: string,
        private readonly logger: ServiceLogger,
        private readonly getTemplateOptions: () => Promise<{ id: string; name: string; description: string }[]>,
        private readonly cmsClient: CmsClient,
        private readonly pageOperator: PageOperator,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<TemplateSelectionRequest>> {
        const schemaId = '';

        // Fetch existing entities to help planner
        const schemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const entityNames = schemas.filter((s: any) => s.type === 'entity').map((s: any) => s.name).filter(Boolean) as string[];
        const existingPageNames = schemas.filter((s: any) => s.type === 'page' && s.settings?.page?.name).map((s: any) => s.settings.page.name) as string[];

        let existingPagePlan: PagePlan | undefined = undefined;
        if (schemaId) {
            const schema = schemas.find((s: any) => s.id === schemaId);
            existingPagePlan = schema!.settings!.page!.metadata.plan;
        }
        const messages = {
            entityNames,
            existingPageNames,
            existingPagePlan
        }
        const developerMessage = JSON.stringify(messages);

        const pagePlan: PagePlan = await this.aiProvider.generate(
            this.plannerSystemPrompt,
            developerMessage,
            userInput,
            context.signal ? { signal: context.signal } : undefined
        );

        // If the planner couldn't match an entity, stop the pipeline
        if (!pagePlan.entityName) {
            const reason = (pagePlan as any).reason || 'No matching entity was found for your request.';
            throw new UserVisibleError(reason);
        }

        const entityPart = pagePlan.entityName ? ` for entity "${pagePlan.entityName}"` : '';
        const message = `I have determined that you want to create a "${pagePlan.pageType}" page${entityPart}. ` +
            `I've also designed a route: ${pagePlan.pageName}. ` +
            `Please select a design template to proceed with generation.`;
        await context.saveAgentMessage(message);

        // Load templates from DB and prepend "No Style" option
        const dbTemplates = await this.getTemplateOptions();
        const noStyleOption = { id: '', name: 'No Style', description: 'Generate without a specific design template. The AI will use its own judgement.' };
        const templates = [noStyleOption, ...dbTemplates];

        return {
            plan: {
                userInput,
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

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<ActResult<TemplateSelectionRequest>> {
        return { feedback: plan, syncedSchemaIds: [] };
    }

    async finalize(feedbackData: TemplateSelectionResponse, context: AgentContext): Promise<FinalizeResult> {
        const schemaId = await this.pageOperator.savePlanAndUserInput(
            undefined,
            feedbackData.requestPayload.plan,
            feedbackData.selectedTemplate,
            feedbackData.requestPayload.userInput,
            context.externalCookie
        );
        const userInput = feedbackData.requestPayload.userInput;
        return {
            syncedSchemaIds: [],
            followingTaskItems: [
                { agentName: AGENT_NAMES.PAGE_ARCHITECT, status: 'pending', description: userInput, schemaId },
            ]
        };
    }
}


