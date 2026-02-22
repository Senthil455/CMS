
import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-assistant';
import { AGENT_NAMES } from '@cms/shared';
import { PageManager } from '../cms/page-manager';
import { type PageArchitecture, type PagePlan } from '@cms/shared';
// PageArchitect import removed

export interface ArchitectDesignerAgentPlan extends PageArchitecture {
    userInput: string;
    schemaId: string;
}

export class PageArchitect extends BaseAgent<ArchitectDesignerAgentPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly architectSystemPrompt: string, // Replaces PageArchitect
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger
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

        const metadata = JSON.parse(existingSchema.settings.page.metadata);
        const routingPlan = metadata.plan;
        const actualUserInput = metadata.userInput || userInput;

        if (!routingPlan) {
            throw new Error("Routing plan not found in page metadata.");
        }

        // Pass pageType from metadata if available to guide architect
        const existingArchitecture = metadata.architecture || {};

        const queries = await this.cmsClient.getAllQueries(context.externalCookie);

        const architecturePlan = await this.plan(actualUserInput, context, queries, routingPlan, existingArchitecture);

        return {
            ...architecturePlan,
            userInput: actualUserInput,
            schemaId
        };
    }

    async act(plan: ArchitectDesignerAgentPlan, context: AgentContext): Promise<AgentResponse | null> {
        const pageManager = new PageManager(this.cmsClient, this.logger, context.externalCookie);
        await pageManager.saveArchitecture(plan.schemaId, plan);

        await context.saveAgentMessage(`I've planned the structure and components for your page.`);

        // Chain to HTML Generator
        return {
            nextAgent: AGENT_NAMES.PAGE_BUILDER,
            nextUserInput: ``
        };
    }

    private async plan(userInput: string, context: AgentContext, availableQueries: any[], pagePlan: PagePlan, existingArchitecture?: Partial<PageArchitecture>): Promise<PageArchitecture> {
        const queryListContext = availableQueries.map((q: any) =>
            `- ${q.name}: ${q.settings?.query?.source}
             arguments: ${JSON.stringify(q.settings?.query?.arguments)}
            `).join('\n');

        let developerMessage = `
ROUTING PLAN:
- Planned Path: ${pagePlan.pageName}
- Parameters: ${pagePlan.primaryParameter || 'None'}
- Linking Rules: ${pagePlan.linkingRules.join(', ')}

AVAILABLE QUERIES:
${queryListContext}
`;

        if (existingArchitecture) {
            developerMessage += `\nEXISTING STRUCTURE:\n${JSON.stringify(existingArchitecture, null, 2)}\nPreserve the existing structure unless changes are requested.`;
        }

        developerMessage += '\n\nIDENTIFY THE PAGE TYPE AND PLAN THE STRUCTURE. Use the parameters from routing plan to select appropriate queries.';

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
