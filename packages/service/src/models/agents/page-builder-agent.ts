import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { type PageMetadata, type SaveSchemaPayload, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-agent';
import { PageManager } from '../cms/page-manager';


export interface PageBuilderResponse {
    title: string;
    layoutJson: any;
}

export interface PageBuilderPlan extends PageBuilderResponse {
    enableEngagementBar: boolean;
}

export class PageBuilderAgent extends BaseAgent<PageBuilderPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly styleMap: Record<string, string>,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
        private readonly baseUrl: string,
    ) {
        super("generating your html", logger, aiProvider);
    }


    async think(userInput: string, context: AgentContext): Promise<PageBuilderPlan> {
        this.logger.info('PageBuilder think started');

        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new Error("PageBuilder requires a valid schema ID in context.");
        }

        // Fetch Schema
        await context.updateStatus('Fetching page schema and metadata...');
        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new Error(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const metadata: PageMetadata = JSON.parse(existingPageSchema.settings.page.metadata);
        const pagePlan = metadata.plan;
        const architecturePlan = metadata.architecture;
        const originalInput = metadata.userInput || userInput;

        if (!pagePlan || !architecturePlan) {
            throw new Error("Required plans (routing or architecture) not found in page metadata.");
        }

        const templateStyle = metadata.templateId || 'modern';



        // 3. Context Gathering: Fetch selected Queries and their sample data
        await context.updateStatus('Gathering data architecture context and samples...');
        const queryDetails = await Promise.all(architecturePlan.selectedQueries.map(async (sq) => {
            const queryName = sq.queryName;
            const fieldName = sq.fieldName;
            try {
                const sampleData = await this.cmsClient.requestQuery(context.externalCookie, queryName);
                return `QUERY: ${queryName} -> FIELD: ${fieldName}
                    ENDPOINTS: ${this.baseUrl}/api/queries/${queryName} 
                    REFERENCE RESPONSE SHAPE (DO NOT OUTPUT): ${JSON.stringify(sampleData)}`;
            } catch (e) {
                return `QUERY: ${queryName} -> FIELD: ${fieldName}
                    ENDPOINTS: ${this.baseUrl}/api/queries/${queryName}`;
            }
        }));


        const pageType = pagePlan.pageType;
        let enableEngagementBar = metadata.enableEngagementBar || false;

        if (pageType === 'list') {
            enableEngagementBar = false;
        }
        const styleKey = `${templateStyle}-${pageType}`;
        const stylePrompt = this.styleMap[styleKey] || this.styleMap[`modern-${pageType}`] || this.styleMap[templateStyle] || 'DESIGN STYLE INSTRUCTION: Modern Editorial';

        let developerMessage = `
${stylePrompt}
`;

        developerMessage += `
ROUTING PLAN:
- Path: ${pagePlan.pageName}
- Parameters: ${pagePlan.primaryParameter || 'None'}
- Linking Rules: ${(pagePlan.linkingRules || []).join('\n  ')}

ARCHITECTURAL PLAN:
- Page Type: ${pagePlan.pageType}
- Sections: ${JSON.stringify(architecturePlan.sections, null, 2)}
- Selected Queries: 
${JSON.stringify(architecturePlan.selectedQueries, null, 2)}
- Hints: ${architecturePlan.architectureHints}

DATA ENDPOINTS:
${queryDetails.join('\n')}
`;


        if (existingPageSchema.settings.page.metadata) {
            const m = JSON.parse(existingPageSchema.settings.page.metadata);
            if (m.layoutJson) {
                developerMessage += `\n\nEXISTING PAGE CONTENT:\n${JSON.stringify({
                    title: existingPageSchema.settings.page.title,
                    layoutJson: m.layoutJson
                }, null, 2)}`;
            }
        }

        await context.updateStatus('Generating Layout JSON components with AI...');
        const aiResponse = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            originalInput,
            parseModelFromProvider(context.providerName)
        );

        let builderResponse: PageBuilderResponse;
        if (typeof aiResponse === 'string') {
            builderResponse = JSON.parse(aiResponse);
        } else {
            builderResponse = aiResponse as PageBuilderResponse;
        }

        return {
            ...builderResponse,
            enableEngagementBar
        };

    }

    async act(plan: PageBuilderPlan, context: AgentContext): Promise<AgentResponse | null> {
        const pageManager = new PageManager(this.cmsClient, this.logger, context.externalCookie);
        const schemaId = context.schemaId;
        if (!schemaId) throw new Error("Schema ID missing in context during Act");

        await context.updateStatus('Saving generated Components JSON to CMS...');
        const newSchemaId = await pageManager.saveLayout(schemaId, plan.layoutJson, plan.title);

        await context.onSchemasSync({
            task_type: context.agentName,
            schemasId: [newSchemaId]
        });

        // Completion
        const finalMessage = "I have generated your Page Layout, you can find it in CMS.";
        await context.saveAgentMessage(finalMessage);
        return null;
    }
}
