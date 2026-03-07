import type { AIProvider } from '../infrastructures/ai-provider.interface';
import { type PageMetadata } from '@cms/shared';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type ThinkResult, type Agent, type ActResult, type FinalizeResult } from './chat-assistant';
import { PageOperator } from '../operators/page-operator';
import { UserVisibleError } from './user-visible-error';

export interface ComponentHtmlResponse {
    html: string;
}

export interface ComponentBuilderPlan {
    title: string;
    componentId: string;
    html: string;
}

export class ComponentBuilder implements Agent<ComponentBuilderPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly getStylePrompt: (styleName: string, pageType: string) => Promise<string>,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
        private readonly pageOperator: PageOperator,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<ComponentBuilderPlan>> {
        this.logger.info(`ComponentBuilder think started`);

        const schemaId = context.schemaId;
        if (!schemaId) {
            throw new UserVisibleError("ComponentBuilder requires a valid schema ID in context.");
        }

        // Fetch Schema
        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!existingPageSchema || !existingPageSchema.settings?.page?.metadata) {
            throw new UserVisibleError(`Page schema not found or missing metadata for ID: ${schemaId}`);
        }

        const metadata: PageMetadata = existingPageSchema.settings.page.metadata;
        const pagePlan = metadata.plan;
        const architecturePlan = metadata.architecture;
        const originalInput = metadata.userInput || userInput;
        const componentInstructions = metadata.componentInstructions || architecturePlan?.componentInstructions || [];

        if (!pagePlan || !architecturePlan) {
            throw new UserVisibleError("Required plans (routing or architecture) not found in page metadata.");
        }

        if (componentInstructions.length === 0) {
            throw new UserVisibleError("No component instructions found in page metadata.");
        }

        const overrideComponentId = context.metadata?.componentId as string;
        const instruction = overrideComponentId
            ? componentInstructions.find(x => x.id === overrideComponentId)
            : componentInstructions.find(x => x.instruction === userInput);

        if (!instruction) {
            throw new UserVisibleError(overrideComponentId ? `Component not found by ID: ${overrideComponentId}` : `Component instruction not found matching: ${userInput}`);
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

        // Build query context for this specific component
        const relevantQueryDetails = instruction.queriesToUse
            .map((qName: string) => queryDetailsMap.get(qName) || `QUERY: ${qName} (no details available)`)
            .join('\n');

        let developerMessage = '';

        if (overrideComponentId) {
            developerMessage = `
${stylePrompt ? stylePrompt + '\n' : ''}
COMPONENT ID: ${instruction.id}
ORIGINAL INSTRUCTION: ${instruction.instruction}

NEW REQUIREMENT FROM USER:
"${userInput}"

OVERALL PAGE CONTEXT:
- Page Type: ${pageType}
- Page Title: ${architecturePlan.pageTitle}

DATA ENDPOINTS FOR THIS COMPONENT:
${relevantQueryDetails}
`;
        } else {
            developerMessage = `
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
        }

        // If there are existing components for this ID, include them for refinement
        if (metadata.components && metadata.components[instruction.id]?.html) {
            if (overrideComponentId) {
                developerMessage += `\n\nEXISTING COMPONENT HTML (Modify this base to apply the new requirement):\n${metadata.components[instruction.id]!.html}`;
            } else {
                developerMessage += `\n\nEXISTING COMPONENT HTML:\n${metadata.components[instruction.id]!.html}`;
            }
        }

        await context.saveAgentMessage(`I am building component: ${instruction.id}`);
        const aiResponse = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            originalInput,
            context.signal ? { signal: context.signal } : undefined
        );

        let componentResponse: ComponentHtmlResponse;
        if (typeof aiResponse === 'string') {
            componentResponse = JSON.parse(aiResponse);
        } else {
            componentResponse = aiResponse as ComponentHtmlResponse;
        }

        return {
            plan: {
                title: architecturePlan.pageTitle,
                componentId: instruction.id,
                html: componentResponse.html
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage,
                userInput: originalInput
            }
        };
    }

    async act(plan: ComponentBuilderPlan, context: AgentContext): Promise<ActResult<ComponentBuilderPlan>> {
        const schemaId = context.schemaId;
        if (!schemaId) throw new UserVisibleError("Schema ID missing in context during Act");

        // We could write a new operator method to save a single component, OR just rely on saving the whole map.
        // It's safer to fetch the schema, update the map, and save it.
        const existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        const metadata: PageMetadata = existingPageSchema.settings.page.metadata;
        const layoutJson = metadata.layoutJson || { sections: [] };

        if (!metadata.components) metadata.components = {};
        metadata.components[plan.componentId] = { html: plan.html };

        const newSchemaId = await this.pageOperator.saveComponents(schemaId, layoutJson, metadata.components, plan.title, context.externalCookie);

        await context.saveAgentMessage(`I've built the component: ${plan.componentId}`);
        return { feedback: null, syncedSchemaIds: [newSchemaId] };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }
}
