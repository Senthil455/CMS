
import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, BaseAgent, parseModelFromProvider } from './chat-assistant';
import { AGENT_NAMES } from '@cms/shared';
import { PageOperator } from '../operators/page-operator';
import { type PageArchitecture, type PagePlan } from '@cms/shared';
import { PAGE_ADDON_REGISTRY } from './page-addons/index';

export interface ArchitectDesignerAgentPlan extends PageArchitecture {
    userInput: string;
    schemaId: string;
}

export class PageArchitect extends BaseAgent<ArchitectDesignerAgentPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly architectSystemPrompt: string, // Replaces PageArchitect
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
        private readonly pageOperator: PageOperator
    ) {
        super("architecting your page", logger, aiProvider);
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


        const metadata = existingSchema.settings.page.metadata;
        const routingPlan = metadata.plan;
        const actualUserInput = metadata.userInput || userInput;

        if (!routingPlan) {
            throw new Error("Routing plan not found in page metadata.");
        }

        await context.saveAgentMessage(`Planning architecture for ${routingPlan.pageType} page...`);

        // Pass pageType from metadata if available to guide architect
        const existingArchitecture = metadata.architecture || {};

        const queries = await this.cmsClient.getAllQueries(context.externalCookie);
        const templateStyle = metadata.templateId || '';

        const architecturePlan = await this.generateArchitecturePlan(actualUserInput, context, queries, routingPlan, templateStyle, existingArchitecture);

        return {
            ...architecturePlan,
            userInput: actualUserInput,
            schemaId
        };
    }

    async act(plan: ArchitectDesignerAgentPlan, context: AgentContext): Promise<boolean> {
        await this.pageOperator.saveArchitecture(plan.schemaId, plan, context.externalCookie);

        // Also save componentInstructions into metadata at the top level
        if (plan.componentInstructions && plan.componentInstructions.length > 0) {
            await this.pageOperator.saveComponentInstructions(plan.schemaId, plan.componentInstructions, context.externalCookie);
        }

        await context.saveAgentMessage(`I've planned the structure and components for your page.`);
        return false;
    }

    private async generateArchitecturePlan(userInput: string, context: AgentContext, availableQueries: any[], pagePlan: PagePlan, templateStyle: string, existingArchitecture?: Partial<PageArchitecture>): Promise<PageArchitecture> {
        const queryListContext = availableQueries.map((q: any) =>
            `- ${q.name}: ${q.settings?.query?.source}
             arguments: ${JSON.stringify(q.settings?.query?.arguments)}
            `).join('\n');

        const addonsListContext = PAGE_ADDON_REGISTRY.map(addon =>
            `- ${addon.id}: ${addon.label} (${addon.pageTypes.join(', ')} pages) - ${addon.chatMessage}`
        ).join('\n');

        let developerMessage = `
${templateStyle ? `DESIGN TEMPLATE: ${templateStyle}\n` : ''}
ROUTING PLAN:
- Planned Path: ${pagePlan.pageName}
- Parameters: ${pagePlan.primaryParameter || 'None'}
- Linking Rules: ${pagePlan.linkingRules?.join(', ') || 'None'}

AVAILABLE ADD-ONS:
${addonsListContext}

AVAILABLE QUERIES:
${queryListContext}
`;

        if (existingArchitecture) {
            developerMessage += `\nEXISTING STRUCTURE:\n${JSON.stringify(existingArchitecture, null, 2)}\nPreserve the existing structure unless changes are requested.`;
        }

        developerMessage += '\n\nIDENTIFY THE PAGE TYPE AND PLAN THE STRUCTURE. Use the parameters from routing plan to select appropriate queries.';

        this.setLastPrompts(this.architectSystemPrompt, developerMessage, userInput);

        await context.saveAgentMessage(`Designing page architecture...`);

        const response = await this.aiProvider.generate(
            this.architectSystemPrompt,
            developerMessage,
            userInput,
            parseModelFromProvider(context.providerName)
        );

        // Expecting JSON response as specified in prompt
        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as PageArchitecture;
        } catch (e) {
            this.logger.error({ error: e, response }, 'Failed to parse PageArchitect response');
            // Fallback plan
            return {
                pageTitle: '',
                sections: [
                    { preset: '12', columns: [{ span: 12, id: 'main-content' }] }
                ],
                selectedQueries: [
                    { queryName: 'fallback_query', fieldName: 'data', type: 'list', description: 'Default query', args: {} }
                ],
                architectureHints: 'Generate a basic layout'
            };
        }
    }
}
