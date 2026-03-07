import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type ThinkResult, type Agent, type ActResult, type FinalizeResult } from '../chat-assistant';
import { type ComponentInstruction, type PageComponentDefinition, type PageDto, type PageMetadata, type LayoutJson, type PageArchitecture } from '@cms/shared';
import { PageOperator } from '../../operators/page-operator';
import { UserVisibleError } from '../user-visible-error';

export interface ComponentBuilderPlan {
    componentId: string;
    html: string;
    componentTypeId?: string;
}

export class PageComponentBuilder implements Agent<ComponentBuilderPlan> {
    constructor(
        private readonly addonDef: PageComponentDefinition,
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly snippet: string | undefined,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly pageOperator: PageOperator,
        private readonly baseUrl: string,
        private readonly getStylePrompt?: (styleName: string, pageType: string) => Promise<string>,
    ) { }

    async think(userInput: string, context: AgentContext, componentInstruction?: ComponentInstruction): Promise<ThinkResult<ComponentBuilderPlan>> {
        this.logger.info(`PageComponentBuilder[${this.addonDef.id}] think started`);

        let schemaId = context.schemaId;
        if (!schemaId) {
            const idMatch = userInput.match(/#([^:]+):/);
            schemaId = idMatch ? idMatch[1] : undefined;
        }

        if (!schemaId) {
            throw new UserVisibleError("ComponentBuilder requires a valid schema ID in context.");
        }

        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new UserVisibleError(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const pageDto = existingPageSchema.settings.page;
        const metadata = pageDto.metadata as PageMetadata;
        const pagePlan = metadata.plan;
        const architecturePlan = metadata.architecture;
        const originalInput = metadata.userInput || userInput;
        const componentInstructions = metadata.componentInstructions || architecturePlan?.componentInstructions || [];

        if (!pagePlan || !architecturePlan) {
            throw new UserVisibleError("Required plans (routing or architecture) not found in page metadata.");
        }

        const overrideComponentId = context.metadata?.componentId as string;

        let instruction = componentInstruction;
        if (!instruction) {
            instruction = overrideComponentId
                ? componentInstructions.find(x => x.id === overrideComponentId)
                : componentInstructions.find(x => x.instruction === userInput);
        }

        if (!instruction) {
            throw new UserVisibleError(overrideComponentId ? `Component not found by ID: ${overrideComponentId}` : `Component instruction not found matching: ${userInput}`);
        }

        const templateStyle = metadata.templateId || '';
        const pageType = pagePlan.pageType;
        const stylePrompt = this.getStylePrompt ? await this.getStylePrompt(templateStyle, pageType) : '';

        // Build base developer message text (used for common_components mostly)
        let developerMessageText = `\n${stylePrompt ? stylePrompt + '\n' : ''}COMPONENT ID: ${instruction.id}\n`;

        if (overrideComponentId) {
            developerMessageText += `ORIGINAL INSTRUCTION: ${instruction.instruction}\n\nNEW REQUIREMENT FROM USER:\n"${userInput}"\n`;
        } else {
            developerMessageText += `COMPONENT INSTRUCTION: ${instruction.instruction}\n`;
        }

        developerMessageText += `\nOVERALL PAGE CONTEXT:
            - Page Type: ${pageType}
            - Page Title: ${architecturePlan.pageTitle}
            - Route: ${pagePlan.pageName}
            - Parameters: ${pagePlan.primaryParameter || 'None'}
            - Architecture Hints: ${architecturePlan.architectureHints}
        `;

        // Either specific text queries (common component) or JSON queries (addons)
        const relevantQueryDetailsText = await this.fetchQueryDetailsForCommon(architecturePlan.selectedQueries, instruction, context.externalCookie);
        developerMessageText += `\nDATA ENDPOINTS FOR THIS COMPONENT:\n${relevantQueryDetailsText}\n`;

        if (metadata.components && metadata.components[instruction.id]?.html) {
            developerMessageText += `\nEXISTING COMPONENT HTML${overrideComponentId ? ' (Modify this base)' : ''}:\n${metadata.components[instruction.id]!.html}`;
        }

        // Build JSON developer message for addons
        const addonDeveloperMessage: Record<string, any> = {
            pageUrl: `/${pageDto.name}`,
            componentInstruction: instruction.instruction,
        };

        if (this.snippet) {
            const entityName = pagePlan.entityName || '';
            addonDeveloperMessage[`${this.addonDef.id}Snippet`] = this.snippet.replace(/{{entityName}}/g, entityName);
        }

        if (this.addonDef.needQueries) {
            addonDeveloperMessage.queries = await this.fetchQueryDetailsForAddon(metadata, context, instruction);
        }

        // Always use combined context for addons
        const finalDeveloperMessage = `\n${developerMessageText}\n\nJSON CONTEXT FOR ADDON:\n${JSON.stringify(addonDeveloperMessage, null, 2)}`;

        await context.saveAgentMessage(`I am building component: ${instruction.id} (${this.addonDef.label})`);

        const aiResponse = await this.aiProvider.generate(
            this.systemPrompt,
            finalDeveloperMessage,
            overrideComponentId ? userInput : originalInput,
            context.signal ? { signal: context.signal } : undefined
        );

        let parsedResponse: any;
        if (typeof aiResponse === 'string') {
            try {
                parsedResponse = JSON.parse(aiResponse);
            } catch (e) {
                this.logger.error({ response: aiResponse }, "Failed to parse AI response as JSON");
                throw new UserVisibleError("The AI agent generated an invalid response. Please try again.");
            }
        } else {
            parsedResponse = aiResponse;
        }

        // Normalize response plan
        const responseComponentId = parsedResponse.component?.id || instruction.id;
        const newHtml = parsedResponse.component?.html || parsedResponse.html || '';

        return {
            plan: {
                componentId: responseComponentId,
                html: newHtml,
                ...(this.addonDef.id !== 'common_component' && { componentTypeId: this.addonDef.id }),
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage: finalDeveloperMessage,
                userInput: overrideComponentId ? userInput : originalInput
            }
        };
    }

    async act(plan: ComponentBuilderPlan, context: AgentContext): Promise<ActResult<ComponentBuilderPlan>> {
        const schemaId = context.schemaId;
        if (!schemaId) throw new UserVisibleError("Schema ID missing in context during Act");

        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        const metadata: PageMetadata = existingPageSchema.settings.page.metadata;
        const layoutJson = metadata.layoutJson || { sections: [] };

        if (!metadata.components) metadata.components = {};

        const componentData: any = { html: plan.html };
        if (plan.componentTypeId) {
            componentData.componentTypeId = plan.componentTypeId;
        }
        metadata.components[plan.componentId] = componentData;

        const newSchemaId = await this.pageOperator.saveComponents(schemaId, layoutJson, metadata.components, undefined, context.externalCookie);

        return { feedback: null, syncedSchemaIds: [newSchemaId] };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }

    private async fetchQueryDetailsForCommon(selectedQueries: PageArchitecture['selectedQueries'], instruction: ComponentInstruction, externalCookie: string): Promise<string> {
        const queryDetailsMap = new Map<string, string>();
        for (const sq of selectedQueries) {
            const queryName = sq.queryName;
            const fieldName = sq.fieldName;
            try {
                const sampleData = await this.cmsClient.requestQuery(externalCookie, queryName);
                queryDetailsMap.set(queryName, `QUERY: ${queryName} -> FIELD: ${fieldName}\nENDPOINTS: ${this.baseUrl}/api/queries/${queryName}\nREFERENCE RESPONSE SHAPE (DO NOT OUTPUT): ${JSON.stringify(sampleData)}`);
            } catch (e) {
                queryDetailsMap.set(queryName, `QUERY: ${queryName} -> FIELD: ${fieldName}\nENDPOINTS: ${this.baseUrl}/api/queries/${queryName}`);
            }
        }

        return instruction.queriesToUse
            .map((qName: string) => queryDetailsMap.get(qName) || `QUERY: ${qName} (no details available)`)
            .join('\n');
    }

    private async fetchQueryDetailsForAddon(metadata: PageMetadata, context: AgentContext, componentInstruction: ComponentInstruction) {
        const selectedQueries = metadata.architecture?.selectedQueries || [];
        if (selectedQueries.length === 0) return null;

        const queriesToFetch = componentInstruction?.queriesToUse?.length
            ? selectedQueries.filter(sq => componentInstruction.queriesToUse.includes(sq.queryName))
            : selectedQueries;

        if (queriesToFetch.length === 0) return null;

        const allSchemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const querySchemas = allSchemas.filter((s: any) => s.type === 'query');

        const queriesWithVars = queriesToFetch.map(sq => {
            const querySchema = querySchemas.find((qs: any) => qs.settings?.query?.name === sq.queryName);
            const variables = querySchema?.settings?.query?.variables || [];
            return {
                queryName: sq.queryName,
                fieldName: sq.fieldName,
                type: sq.type,
                args: sq.args,
                variables: variables.filter((v: any) => v.name !== 'sandbox'),
            };
        });

        return queriesWithVars;
    }
}

