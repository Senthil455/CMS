import type { AIProvider } from '../../infrastructures/agent.interface';
import { type SchemaDto, type SaveSchemaPayload, type TemplateSelectionResponse } from '@cms/shared';
import { type RoutingPlan, type PageArchitecturePlan } from './page-generator';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleChatError } from './chat-agent';

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

        // This is a bit unusual as 'think' has side effects (saving messages), but it's part of the interaction flow.
        // We will try to keep side effects minimal or move them to 'act' if possible, but the 'generate' call is the main 'think' part.

        // However, the original code had intermediate messages. We might need to keep them or move them.
        // For strict separation, 'think' should just generate the plan.
        // Intermediate status updates are tricky. Let's send the "generating" message in 'think' as it's part of the process feedback.
        await context.saveAssistantMessage(`Generating page using "${response.selectedTemplate}" template...`);

        await context.saveAiResponseLog('page-generator-template-selection-response',
            JSON.stringify({ ...response, taskType: 'page-generator-template-selection-response' })
        );

        // Generation
        const htmlResponse = await this.generate(
            originalInput,
            routingPlan,
            architecturePlan,
            queryDetails,
            existingPageSchema,
            response.selectedTemplate,
            response.enableEngagementBar
        );

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
        // Save AI response to database log
        await context.saveAiResponseLog('page-generator',
            JSON.stringify({ ...plan, taskType: context.taskType })
        );

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
            await this.act(plan, context);
        } catch (error) {
            await handleChatError(error, context, this.logger, "processing html generation request");
        }
    }

    // Removed generateAndSave as it is now covered by think+act logic flows.
    // However, ChatService was calling generateAndSave directly. We need to check if ChatService refactor is needed or if handle is enough.
    // The previous prompt instructions imply we should use 'handle' (or think/act) as the standard way.
    // ChatService calls 'generateAndSave' in handleTemplateSelectionResponse.
    // We should update ChatService to call 'handle' (or think/act) or expose think/act on interface.
    // Since Agent interface now has think/act, ChatService can use them or just handle.
    // Let's assume ChatService will use the standard 'handle' or we update it to use think/act if needed.
    // Actually, ChatService uses 'handler.generateAndSave(response, context)' for HTML generator specifically. 
    // We should probably update ChatService to call 'handle(JSON.stringify(response), context)' to match the 'userInput' expectation of handle/think.
    // OR we conform think/act to take the object if we change the signature? But Agent says userInput: string.
    // So passing JSON stringified response is the way to go to unify interface.

    async generate(
        userInput: string,
        routingPlan: RoutingPlan,
        architecturePlan: PageArchitecturePlan,
        queryDetails: string[],
        existingPageSchema: SchemaDto | null,
        templateStyle: string = 'modern',
        enableEngagementBar: boolean = false
    ): Promise<HtmlGenerationResponse> {

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
${architecturePlan.selectedQueries.map(sq => `  * ${sq.queryName} (Field: ${sq.fieldName}, Type: ${sq.type}): ${JSON.stringify(sq.args)} (fromPath=Source from primary route param; fromQuery=Source from same-named URL query param)`).join('\n')}
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

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput
        );

        if (typeof response === 'string') {
            return JSON.parse(response);
        }
        return response as HtmlGenerationResponse;
    }
}
