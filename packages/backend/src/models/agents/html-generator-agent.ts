import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { type PageMetadata, type SaveSchemaPayload, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, type AgentResponse, handleAgentError } from './chat-agent';
import { PageManager } from '../cms/page-manager';


export interface HtmlGenerationResponse {
    name: string;
    title: string;
    html: string;
}

export interface HtmlGeneratorPlan extends HtmlGenerationResponse {
    enableEngagementBar: boolean;
}

export class HtmlGenerator implements Agent<HtmlGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly styleMap: Record<string, string>,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

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

        const queryDetails = await Promise.all((architecturePlan.selectedQueries || []).map(async (sq) => {
            const queryName = sq.queryName;
            try {
                return `QUERY: ${queryName}`;
            } catch (e) {
                return `QUERY: ${queryName}`;
            }
        }));

        const enableEngagementBar = metadata.enableEngagementBar || false;

        const pageType = metadata.pageType;
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

    async act(plan: HtmlGeneratorPlan, context: AgentContext): Promise<void> {
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
        await context.saveAssistantMessage(finalMessage);
    }

    async handle(userInput: string, context: AgentContext): Promise<AgentResponse | null> {
        this.logger.info('HtmlGenerator initiated via direct handle call');
        try {
            const plan = await this.think(userInput, context);
            await context.saveAiResponseLog(AGENT_NAMES.HTML_GENERATOR,
                JSON.stringify({ ...plan, taskType: context.taskType })
            );
            await this.act(plan, context);

            if (plan.enableEngagementBar) {
                return {
                    nextAgent: AGENT_NAMES.ENGAGEMENT_BAR_AGENT,
                    nextUserInput: ``
                };
            }

            return null;
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your html", this.aiProvider);
            return null;
        }
    }
}
