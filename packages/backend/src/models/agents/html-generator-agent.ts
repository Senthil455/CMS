import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { type PageMetadata, type SaveSchemaPayload, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent } from './chat-agent';
import { PageManager } from '../cms/page-manager';


export interface HtmlGenerationResponse {
    name: string;
    title: string;
    html: string;
}

export interface HtmlGeneratorPlan extends HtmlGenerationResponse {
    enableEngagementBar: boolean;
}

export class HtmlGenerator extends BaseAgent<HtmlGeneratorPlan> {
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

    async think(userInput: string, context: AgentContext): Promise<HtmlGeneratorPlan> {
        this.logger.info('HtmlGenerator think started');

        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new Error("HtmlGenerator requires a valid schema ID in context.");
        }

        // Fetch Schema
        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new Error(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const metadata: PageMetadata = JSON.parse(existingPageSchema.settings.page.metadata);
        const routingPlan = metadata.routingPlan;
        const architecturePlan = metadata.architecturePlan;
        const originalInput = metadata.userInput || userInput;

        if (!routingPlan || !architecturePlan) {
            throw new Error("Required plans (routing or architecture) not found in page metadata.");
        }

        const templateStyle = metadata.templateId || 'modern';



        // 3. Context Gathering: Fetch selected Queries and their sample data
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


        const pageType = metadata.pageType;
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
- Path: ${routingPlan.pageName}
- Parameters: ${routingPlan?.primaryParameter || 'None'}
- Linking Rules: ${(routingPlan?.linkingRules || []).join('\n  ')}

ARCHITECTURAL PLAN:
- Page Type: ${metadata.pageType}
- Layout: ${architecturePlan.layout?.structure}
- Selected Queries: 
${JSON.stringify(architecturePlan.selectedQueries, null, 2)}
- Hints: ${architecturePlan.architectureHints}

DATA ENDPOINTS:
${queryDetails.join('\n')}
`;

        if (existingPageSchema.settings.page.html) {
            const p = existingPageSchema.settings.page;
            developerMessage += `\n\nEXISTING PAGE CONTENT:\n${JSON.stringify({
                name: p.name,
                title: p.title,
                html: p.html
            }, null, 2)}`;
        }

        const aiResponse = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            originalInput
        );

        let htmlResponse: HtmlGenerationResponse;
        if (typeof aiResponse === 'string') {
            htmlResponse = JSON.parse(aiResponse);
        } else {
            htmlResponse = aiResponse as HtmlGenerationResponse;
        }

        return {
            ...htmlResponse,
            enableEngagementBar
        };
    }

    async act(plan: HtmlGeneratorPlan, context: AgentContext): Promise<AgentResponse | null> {
        const pageManager = new PageManager(this.cmsClient, this.logger, context.externalCookie);
        const schemaId = context.schemaId;
        if (!schemaId) throw new Error("Schema ID missing in context during Act");

        const newSchemaId = await pageManager.savePageHtml(schemaId, plan.html, plan.title);

        if (newSchemaId) {
            await context.onSchemasSync({
                task_type: 'page_generator',
                schemasId: [newSchemaId]
            });
        }

        // Completion
        const finalMessage = "I have generated your HTML page, you can find it in CMS.";
        await context.saveAgentMessage(finalMessage);

        if (plan.enableEngagementBar) {
            return {
                nextAgent: AGENT_NAMES.ENGAGEMENT_BAR_AGENT,
                nextUserInput: ``
            };
        }
        return null;
    }
}
