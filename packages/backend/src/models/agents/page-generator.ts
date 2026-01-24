import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, type AgentResponse, handleAgentError } from './chat-agent';
import { type SaveSchemaPayload, type TemplateSelectionRequest, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { PageTypePlanner } from '../planners/page-type-planner';

export class PageGenerator implements Agent<TemplateSelectionRequest> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly pageTypePlanner: PageTypePlanner,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
        private readonly templates: Record<string, { id: string, name: string, description: string }[]>
    ) { }

    async think(userInput: string, context: AgentContext): Promise<TemplateSelectionRequest> {


        // 1. Identification: Check if user input contains #schemaId:
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.PAGE_GENERATOR}#([^:]+):`));
        if (idMatch) {
            const schemaId = idMatch[1];
            await context.saveAssistantMessage(`I am Page generator, I detected you want to modify page with ID "${schemaId}". I will help you choose a template for the new version...`);
        }



        const pageTypePlan = await this.pageTypePlanner.plan(userInput, context);
        await context.saveAssistantMessage(`I have determined that you want to create a "${pageTypePlan.pageType}" page.`);

        // Define templates based on page type
        let templates: { id: string, name: string, description: string }[] = [];

        if (pageTypePlan.pageType === 'detail') {
            templates = this.templates['detail'] || [];
        } else {
            // Default to List/Index logic
            templates = this.templates['list'] || [];
        }

        return {
            userInput,
            pageType: pageTypePlan.pageType,
            providerName: context.providerName,
            templates: templates
        };
    }

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<void> {
        // We know plan has pageType
        const pageType = plan.pageType;
        if (pageType === 'detail') {
            await context.onTemplateSelectionDetailToConfirm(plan);
        } else {
            await context.onTemplateSelectionListToConfirm(plan);
        }

        await context.saveAssistantMessage("I have analyzed your request. Please select a design template to proceed with generation.");
    }

    async handle(userInput: string, context: AgentContext): Promise<AgentResponse | null> {
        try {
            const plan = await this.think(userInput, context);
            await this.act(plan, context);
            return null;
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your page", this.aiProvider);
            return null;
        }
    }
}

