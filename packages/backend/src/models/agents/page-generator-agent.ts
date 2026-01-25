import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, type AgentResponse, handleAgentError } from './chat-agent';
import { type TemplateSelectionRequest, AGENT_NAMES } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { PageTypePlanner } from '../planners/page-type-planner';

export class PageGenerator implements Agent<TemplateSelectionRequest> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly pageTypePlanner: PageTypePlanner,
        private readonly logger: ServiceLogger,
        private readonly templates: Record<string, { id: string, name: string, description: string }[]>
    ) { }

    async think(userInput: string, context: AgentContext): Promise<TemplateSelectionRequest> {

        let schemaId = '';
        // 2. Or check for #schemaId
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.ROUTER_DESIGNER}#([^:]+):`));
        if (idMatch && idMatch[1]) {
            schemaId = idMatch[1];
        }

        const pageTypePlan = await this.pageTypePlanner.plan(userInput, context);
        await context.saveAssistantMessage(`I have determined that you want to create a "${pageTypePlan.pageType}" page.`);

        let templates: { id: string, name: string, description: string }[] = [];

        if (pageTypePlan.pageType === 'detail') {
            templates = this.templates['detail'] || [];
        } else {
            templates = this.templates['list'] || [];
        }
        return {
            userInput,
            pageType: pageTypePlan.pageType,
            schemaId: schemaId,
            providerName: context.providerName,
            templates: templates
        };
    }

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<void> {
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

            // Save AI response to database log
            await context.saveAiResponseLog(AGENT_NAMES.PAGE_GENERATOR,
                JSON.stringify({ ...plan, taskType: context.taskType })
            );

            await this.act(plan, context);
            return null;
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your page", this.aiProvider);
            return null;
        }
    }
}

