import type { AIProvider } from '../infrastructures/ai-provider.interface';
import { type PageMetadata, type LayoutJson, SOCKET_EVENTS } from '@cms/shared';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type AgentPlanResponse, type Agent } from './chat-assistant';
import { PageAddonBuilder } from './page-addons/PageAddonBuilder';
import { PageOperator } from '../operators/page-operator';


export interface ComponentHtmlResponse {
    html: string;
}

export interface PageBuilderPlan {
    title: string;
    layoutJson: LayoutJson;
    components: Record<string, { html: string; addonId?: string; }>;
}

export class PageBuilder implements Agent<PageBuilderPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly getStylePrompt: (styleName: string, pageType: string) => Promise<string>,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
        private readonly pageOperator: PageOperator,
        private readonly addonHandlers: Record<string, Agent<any>> = {},
    ) { }


    async think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<PageBuilderPlan>> {
        this.logger.info('PageBuilder think started');

        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new Error("PageBuilder requires a valid schema ID in context.");
        }

        // Fetch Schema
        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new Error(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const metadata: PageMetadata = existingPageSchema.settings.page.metadata;
        const pagePlan = metadata.plan;
        const architecturePlan = metadata.architecture;
        const originalInput = metadata.userInput || userInput;
        const componentInstructions = metadata.componentInstructions || architecturePlan?.componentInstructions || [];

        if (!pagePlan || !architecturePlan) {
            throw new Error("Required plans (routing or architecture) not found in page metadata.");
        }

        if (componentInstructions.length === 0) {
            throw new Error("No component instructions found in page metadata. The architect must generate componentInstructions.");
        }

        const templateStyle = metadata.templateId || '';
        const pageType = pagePlan.pageType;

        const stylePrompt = await this.getStylePrompt(templateStyle, pageType);

        // Gather query endpoint details and sample data
        const queryDetailsMap = new Map<string, string>();
        for (const sq of architecturePlan.selectedQueries) {
            const queryName = sq.queryName;
            const fieldName = sq.fieldName;
            try {
                const sampleData = await this.cmsClient.requestQuery(context.externalCookie, queryName);
                queryDetailsMap.set(queryName, `QUERY: ${queryName} -> FIELD: ${fieldName}
                    ENDPOINTS: ${this.baseUrl}/api/queries/${queryName} 
                    REFERENCE RESPONSE SHAPE (DO NOT OUTPUT): ${JSON.stringify(sampleData)}`);
            } catch (e) {
                queryDetailsMap.set(queryName, `QUERY: ${queryName} -> FIELD: ${fieldName}
                    ENDPOINTS: ${this.baseUrl}/api/queries/${queryName}`);
            }
        }

        // Build layout from architecture sections, or use existing layoutJson
        let layoutJson: LayoutJson;
        if (metadata.layoutJson && metadata.layoutJson.sections) {
            layoutJson = metadata.layoutJson;
        } else {
            const sections = architecturePlan.sections || [];
            layoutJson = {
                sections: sections.map(section => ({
                    preset: section.preset,
                    columns: (section.columns || []).map(col => ({
                        span: col.span,
                        blocks: [{ id: col.id, type: 'ai-generated' }]
                    }))
                }))
            };
        }

        // Generate HTML for each component sequentially
        const components: Record<string, { html: string; addonId?: string; }> = {};
        let overallDeveloperMessage = '';

        for (let i = 0; i < componentInstructions.length; i++) {
            const instruction = componentInstructions[i];
            if (!instruction) continue;


            // Check if this component is a known add-on
            if (instruction.addonId && this.addonHandlers) {
                const addonAgent = this.addonHandlers[instruction.addonId];
                if (addonAgent) {
                    this.logger.info({ addonId: instruction.addonId }, `Routing component generation to specialized add-on agent`);

                    try {
                        // Pass the component instruction to the addon so it can use the architect's queries
                        const addonPlan = addonAgent instanceof PageAddonBuilder
                            ? await (addonAgent as any).think(originalInput, context, instruction)
                            : await (addonAgent as any).think(originalInput, context);

                        if (addonPlan && addonPlan.newComponent) {
                            components[instruction.id] = {
                                html: addonPlan.newComponent.html,
                            };
                            this.logger.info({ componentId: instruction.id }, `Generated add-on component ${i + 1}/${componentInstructions.length}`);
                            continue; // Skip the standard generation path
                        }
                    } catch (err: any) {
                        this.logger.warn({ err, addonId: instruction.addonId }, `Addon agent failed to generate component, falling back to general LLM`);
                    }
                }
            }

            // Build query context for this specific component
            const relevantQueryDetails = instruction.queriesToUse
                .map((qName: string) => queryDetailsMap.get(qName) || `QUERY: ${qName} (no details available)`)
                .join('\n');

            let developerMessage = `
${stylePrompt ? stylePrompt + '\n' : ''}
COMPONENT ID: ${instruction.id}
COMPONENT INSTRUCTION: ${instruction.instruction}

OVERALL PAGE CONTEXT:
- Page Type: ${pageType}
- Page Title: ${architecturePlan.pageTitle}
- Route: ${pagePlan.pageName}
- Parameters: ${pagePlan.primaryParameter || 'None'}

DATA ENDPOINTS FOR THIS COMPONENT:
${relevantQueryDetails}

ARCHITECTURE HINTS: ${architecturePlan.architectureHints}
`;

            // If there are existing components for this ID, include them for refinement
            if (metadata.components && metadata.components[instruction.id]?.html) {
                developerMessage += `\n\nEXISTING COMPONENT HTML:\n${metadata.components[instruction.id]!.html}`;
            }

            overallDeveloperMessage = developerMessage;
            const aiResponse = await this.aiProvider.generate(
                this.systemPrompt,
                developerMessage,
                originalInput,
                context.selection.model,
                context.signal ? { signal: context.signal } : undefined
            );

            let componentResponse: ComponentHtmlResponse;
            if (typeof aiResponse === 'string') {
                componentResponse = JSON.parse(aiResponse);
            } else {
                componentResponse = aiResponse as ComponentHtmlResponse;
            }

            components[instruction.id] = {
                html: componentResponse.html,
                addonId: instruction.addonId ?? '',
            };

            this.logger.info({ componentId: instruction.id }, `Generated component ${i + 1}/${componentInstructions.length}`);
        }

        return {
            plan: {
                title: architecturePlan.pageTitle,
                layoutJson,
                components,
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage: overallDeveloperMessage,
                userInput: originalInput
            }
        };
    }

    async act(plan: PageBuilderPlan, context: AgentContext): Promise<PageBuilderPlan | null> {
        const schemaId = context.schemaId;
        if (!schemaId) throw new Error("Schema ID missing in context during Act");

        const newSchemaId = await this.pageOperator.saveComponents(schemaId, plan.layoutJson, plan.components, plan.title, context.externalCookie);

        await context.emitEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
            task_type: context.agentName,
            schemasId: [newSchemaId]
        });

        // Completion
        const componentCount = Object.keys(plan.components).length;
        const finalMessage = `I have generated ${componentCount} component(s) and compiled them into your page layout. You can find it in explorer.`;
        await context.saveAgentMessage(finalMessage);
        return null;
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<void> {
        // No feedback needed for page building
    }

    async modifySingleComponent(componentId: string, userRequirement: string, context: AgentContext): Promise<void> {
        this.logger.info({ componentId }, 'PageBuilder modifySingleComponent started');

        const schemaId = context.schemaId;
        if (!schemaId) throw new Error("PageBuilder requires a valid schema ID in context.");

        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new Error(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const metadata: PageMetadata = existingPageSchema.settings.page.metadata;
        const pagePlan = metadata.plan;
        const architecturePlan = metadata.architecture;
        const componentInstructions = metadata.componentInstructions || architecturePlan?.componentInstructions || [];

        if (!pagePlan || !architecturePlan) throw new Error("Required plans (routing or architecture) not found in page metadata.");

        const targetInstruction = componentInstructions.find(i => i.id === componentId);
        if (!targetInstruction) {
            //
            // Note: Addons don't have instructions, so we might need a fallback.
            // But for now, user is modifying visually generated components.
            throw new Error(`Component instruction not found for ID: ${componentId}`);
        }

        const templateStyle = metadata.templateId || '';
        const stylePrompt = await this.getStylePrompt(templateStyle, pagePlan.pageType);

        // Gather queries for this component
        const queryDetailsMap = new Map<string, string>();
        for (const qName of targetInstruction.queriesToUse) {
            try {
                const sampleData = await this.cmsClient.requestQuery(context.externalCookie, qName);
                queryDetailsMap.set(qName, `QUERY: ${qName}
                    ENDPOINTS: ${this.baseUrl}/api/queries/${qName}
                    REFERENCE RESPONSE SHAPE: ${JSON.stringify(sampleData)}`);
            } catch (e) {
                queryDetailsMap.set(qName, `QUERY: ${qName}\nENDPOINTS: ${this.baseUrl}/api/queries/${qName}`);
            }
        }
        const relevantQueryDetails = targetInstruction.queriesToUse
            .map((qName: string) => queryDetailsMap.get(qName) || `QUERY: ${qName} (no details available)`)
            .join('\n');

        let developerMessage = `
${stylePrompt ? stylePrompt + '\n' : ''}
COMPONENT ID: ${targetInstruction.id}
ORIGINAL INSTRUCTION: ${targetInstruction.instruction}

NEW REQUIREMENT FROM USER:
"${userRequirement}"

OVERALL PAGE CONTEXT:
- Page Type: ${pagePlan.pageType}
- Page Title: ${architecturePlan.pageTitle}

DATA ENDPOINTS FOR THIS COMPONENT:
${relevantQueryDetails}
`;
        if (metadata.components && metadata.components[componentId]?.html) {
            developerMessage += `\n\nEXISTING COMPONENT HTML (Modify this base to apply the new requirement):\n${metadata.components[componentId]!.html}`;
        }


        const aiResponse = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userRequirement,
            context.selection.model,
            context.signal ? { signal: context.signal } : undefined
        );



        let componentResponse: ComponentHtmlResponse;
        if (typeof aiResponse === 'string') {
            componentResponse = JSON.parse(aiResponse);
        } else {
            componentResponse = aiResponse as ComponentHtmlResponse;
        }

        const newHtml = componentResponse.html;

        // Save only this component
        const layoutJson = metadata.layoutJson || { sections: [] }; // fall back to empty if undefined

        // Merge updated component html back
        if (!metadata.components) metadata.components = {};
        metadata.components[componentId] = { html: newHtml };

        await this.pageOperator.saveComponents(schemaId, layoutJson, metadata.components, existingPageSchema.settings.page.title, context.externalCookie);

        await context.emitEvent(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, {
            task_type: context.agentName,
            schemasId: [schemaId]
        });

        await context.saveAgentMessage(`Successfully updated component "${componentId}" based on your request.`);
    }
}
