import type { AIProvider } from '../../infrastructures/agent.interface';
import { type SaveSchemaPayload, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleAgentError } from './chat-agent';

export interface HtmlGenerationResponse {
    name: string;
    title: string;
    html: string;
}

export interface HtmlGeneratorPlan extends HtmlGenerationResponse, TemplateSelectionResponse {
    routingPlan: any;
    architecturePlan: any;
    schemaId?: string;
    existingPageSchema: any;
}

export class HtmlGenerator implements Agent<HtmlGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly styleMap: Record<string, string>,
        private readonly engagementBarPrompt: string | undefined,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<HtmlGeneratorPlan> {
        this.logger.info('HtmlGenerator think started');
        const response = JSON.parse(userInput) as TemplateSelectionResponse;
        const { userInput: originalInput, routingPlan, architecturePlan, queryDetails, existingPageSchema, schemaId } = response.requestPayload;
        await context.saveAssistantMessage(`Generating page using "${response.selectedTemplate}" template...`);

        // Generation Logic merged from generate()
        const templateStyle = response.selectedTemplate || 'modern';
        const enableEngagementBar = response.enableEngagementBar || false;

        const pageType = architecturePlan.pageType === 'detail' ? 'detail' : 'list';
        const styleKey = `${templateStyle}-${pageType}`;
        const stylePrompt = this.styleMap[styleKey] || this.styleMap[`modern-${pageType}`] || this.styleMap[templateStyle] || 'DESIGN STYLE INSTRUCTION: Modern Editorial';

        let developerMessage = `
${stylePrompt}
`;

        if (enableEngagementBar && this.engagementBarPrompt) {
            developerMessage += `\n\n${this.engagementBarPrompt}\n`;
        }

        developerMessage += `
ROUTING PLAN:
- Path: ${routingPlan.pageName}
- Parameters: ${routingPlan.primaryParameter || 'None'}
- Linking Rules: ${routingPlan.linkingRules.join('\n  ')}

ARCHITECTURAL PLAN:
- Page Type: ${architecturePlan.pageType}
- Layout: ${architecturePlan.layout.structure}
- Selected Queries & Argument Sources: 
${architecturePlan.selectedQueries.map((sq: any) => `  * ${sq.queryName} (Field: ${sq.fieldName}, Type: ${sq.type}): ${JSON.stringify(sq.args)} (fromPath=Source from primary route param; fromQuery=Source from same-named URL query param)`).join('\n')}
- Hints: ${architecturePlan.architectureHints}

DATA ENDPOINTS:
${queryDetails.join('\n')}
`;

        if (existingPageSchema && existingPageSchema.settings.page) {
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
            ...response,
            ...htmlResponse,
            routingPlan,
            architecturePlan,
            schemaId,
            existingPageSchema
        };
    }

    async act(plan: HtmlGeneratorPlan, context: AgentContext): Promise<void> {
        let { title } = plan;
        let name = plan.routingPlan.pageName || (plan.existingPageSchema?.name) || `generated-page-${Date.now()}`;
        title = title || (plan.existingPageSchema?.settings.page?.title) || 'Generated Page';

        // Persistence: Save to CMS
        try {
            const payload: SaveSchemaPayload = {
                schemaId: plan.schemaId || null,
                type: 'page',
                settings: {
                    page: {
                        name: name,
                        title: title,
                        html: plan.html,
                        source: 'ai',
                        metadata: JSON.stringify({
                            routingPlan: plan.routingPlan,
                            architecturePlan: plan.architecturePlan,
                        }),
                    }
                }
            };
            const saveResp = await this.cmsClient.saveSchema(context.externalCookie, payload);
            const newSchemaId = saveResp.data.schemaId;

            this.logger.info({ name, schemaId: newSchemaId }, 'Successfully saved generated page to CMS');

            if (newSchemaId) {
                await context.onSchemasSync({
                    task_type: 'page_generator',
                    schemasId: [newSchemaId]
                });
            }
        } catch (saveError) {
            this.logger.error({ error: saveError }, 'Failed to save generated page to CMS');
        }

        // Completion
        const finalMessage = plan.existingPageSchema
            ? `I have updated the page "${name}", you can view it in CMS.`
            : "I have generated your HTML page, you can find it in CMS.";
        await context.saveAssistantMessage(finalMessage);
    }

    async handle(userInput: string, context: AgentContext): Promise<void> {
        this.logger.info('HtmlGenerator initiated via direct handle call');
        try {
            // We use 'generateAndSave' logic here basically.
            // But wait, the original code had 'generateAndSave' as a separate method called by ChatService in a specific case.
            // AND 'handle' also called 'generateAndSave'.
            // Now logic is in 'think' and 'act'.
            const plan = await this.think(userInput, context);

            // Save AI response to database log
            await context.saveAiResponseLog(AGENT_NAMES.HTML_GENERATOR,
                JSON.stringify({ ...plan, taskType: context.taskType })
            );

            await this.act(plan, context);
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your html", this.aiProvider);
        }
    }
}
