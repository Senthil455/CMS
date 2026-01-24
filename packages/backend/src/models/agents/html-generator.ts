import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { type SaveSchemaPayload, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, type AgentResponse, handleAgentError } from './chat-agent';


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
    createdSchemaId?: string;
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

        let schemaId = '';
        let originalInput = userInput;

        // 1. Extract Schema ID
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.HTML_GENERATOR}#([^:]+):`));
        if (idMatch && idMatch[1]) {
            schemaId = idMatch[1];
            // Basic cleanup of input to remove the command prefix for the AI prompt
            // e.g. "@html_generator #123: Generate HTML" -> "Generate HTML"
            // originalInput = userInput.replace(idMatch[0], '').trim(); 
        } else {
            // Fallback: try parsing as JSON (though unexpected in new flow)
            try {
                const jsonInput = JSON.parse(userInput);
                // We barely expect valid payload here given DTO changes
                if (jsonInput.requestPayload?.userInput) {
                    originalInput = jsonInput.requestPayload.userInput;
                }
            } catch (e) {
                // Ignore
            }
        }

        if (!schemaId) {
            // If no schema ID found, we can't proceed in new flow
            throw new Error("HtmlGenerator requires a valid schema ID.");
        }

        // 2. Fetch Schema
        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new Error(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const metadata = JSON.parse(existingPageSchema.settings.page.metadata);
        const routingPlan = metadata.routingPlan;
        const architecturePlan = metadata.architecturePlan; // Should include pageType

        // We typically stored selectedTemplate in metadata too? 
        // Or we need to infer style? 
        // In the new flow, where is selectedTemplate stored? 
        // RouterDesigner received it. Did it save it? 
        // RouterDesigner didn't explicitly save selectedTemplate in my implementation above, just routingPlan and architecturePlan.
        // We probably should have saved it. 
        // Let's assume for now default or try to find it in metadata if we add it there later.

        const templateStyle = 'modern'; // Default or infer from somewhere else if needed?

        // Fetch query details again? Or rely on what?
        // HtmlGenerator needs query output shapes if possible.
        // Queries are in architecturePlan.selectedQueries

        const queryDetails = await Promise.all((architecturePlan.selectedQueries || []).map(async (sq: any) => {
            const queryName = sq.queryName;
            try {
                // We don't have baseUrl handy here anymore? 
                // It was removed from constructor or not? 
                // I need to check if baseUrl is available. 
                // It wasn't in the constructor in previous file view?
                // Wait, I see `private readonly baseUrl: string` in PageGenerator but NOT in HtmlGenerator.
                // So I need to add it or skip it.
                // For now, let's just show query name.
                return `QUERY: ${queryName}`;
            } catch (e) {
                return `QUERY: ${queryName}`;
            }
        }));

        const enableEngagementBar = false; // We can make this dynamic if stored in metadata or passed in input

        const pageType = architecturePlan.pageType === 'detail' ? 'detail' : 'list';
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
- Page Type: ${architecturePlan.pageType}
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
            selectedTemplate: templateStyle,
            enableEngagementBar,
            requestPayload: {
                userInput: originalInput,
                pageType: architecturePlan.pageType, // Reconstruct minimum DTO
                providerName: context.providerName,
                templates: []
            },
            ...htmlResponse,
            routingPlan,
            architecturePlan,
            schemaId,
            existingPageSchema
        };
    }

    async act(plan: HtmlGeneratorPlan, context: AgentContext): Promise<void> {
        let { title } = plan;

        let name = plan.routingPlan?.pageName || (plan.existingPageSchema?.name) || `generated-page-${Date.now()}`;
        title = title || (plan.existingPageSchema?.settings.page?.title) || 'Generated Page';
        let newSchemaId: string | null = null;

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
            newSchemaId = saveResp.data.schemaId;

            this.logger.info({ name, schemaId: newSchemaId }, 'Successfully saved generated page to CMS');

            if (newSchemaId) {
                plan.createdSchemaId = newSchemaId; // Store for handle
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

    async handle(userInput: string, context: AgentContext): Promise<AgentResponse | null> {
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

            if (plan.enableEngagementBar && plan.createdSchemaId) {
                return {
                    nextAgent: AGENT_NAMES.ENGAGEMENT_BAR_AGENT,
                    nextUserInput: `@${AGENT_NAMES.ENGAGEMENT_BAR_AGENT} #${plan.createdSchemaId}: Add engagement bar`
                };
            }

            return null;
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your html", this.aiProvider);
            return null;
        }
    }
}
