import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent } from './chat-agent';
import { type TemplateSelectionRequest, AGENT_NAMES } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { PageTypePlanner } from '../planners/page-type-planner';
import type { CmsClient } from '../../infrastructures/cms-client';

export class PageGenerator extends BaseAgent<TemplateSelectionRequest> {
    constructor(
        aiProvider: AIProvider,
        private readonly pageTypePlanner: PageTypePlanner,
        logger: ServiceLogger,
        private readonly templates: Record<string, { id: string, name: string, description: string }[]>,
        private readonly cmsClient: CmsClient
    ) {
        super("generating your page", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<TemplateSelectionRequest> {
        let schemaId = '';
        // 2. Or check for #schemaId
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.ROUTER_DESIGNER}#([^:]+):`));
        if (idMatch && idMatch[1]) {
            schemaId = idMatch[1];
        }

        // Fetch existing entities to help planner
        const schemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const entityNames = schemas.map((s: any) => s.name).filter(Boolean) as string[];

        const pageTypePlan = await this.pageTypePlanner.plan(userInput, context, entityNames);
        await context.saveAgentMessage(`I have determined that you want to create a "${pageTypePlan.pageType}" page${pageTypePlan.entityName ? ` for entity "${pageTypePlan.entityName}"` : ''}.`);

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
            ...(pageTypePlan.entityName ? { entityName: pageTypePlan.entityName } : {}),
            templates: templates
        };
    }

    async act(plan: TemplateSelectionRequest, context: AgentContext): Promise<AgentResponse | null> {
        const pageType = plan.pageType;
        if (pageType === 'detail') {
            await context.onTemplateSelectionDetailToConfirm(plan);
        } else {
            await context.onTemplateSelectionListToConfirm(plan);
        }

        await context.saveAgentMessage("I have analyzed your request. Please select a design template to proceed with generation.");
        return null;
    }
}

