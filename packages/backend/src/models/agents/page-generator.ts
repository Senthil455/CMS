import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleChatError } from './chat-agent';
import { type SaveSchemaPayload, type SchemaDto, type TemplateSelectionRequest, type TemplateSelectionResponse, AGENT_TRIGGERS } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/agent.interface';

export interface RoutingPlan {
    pageName: string;
    primaryParameter?: string;
    linkingRules: string[];
    routerHints: string;
}

export interface PageArchitecturePlan {
    pageType: 'list' | 'detail' | 'dashboard' | 'form' | 'custom';
    layout: {
        hasHeader: boolean;
        hasSidebar: boolean;
        hasFooter: boolean;
        structure: string;
    };

    selectedQueries: Array<{
        queryName: string;
        fieldName: string;
        type: 'single' | 'list';
        description: string;
        args: Record<string, 'fromPath' | 'fromQuery'>;
    }>;
    components: Array<{
        name: string;
        type: string;
        queriesUsed: string[];
    }>;
    architectureHints: string;
}

export interface PageGeneratorPlan extends TemplateSelectionRequest {
    // TemplateSelectionRequest already contains what act needs: userInput, routingPlan, architecturePlan, queryDetails, existingPageSchema, schemaId, providerName, templates
    // But we need to structure `think` to return this.
}

export class PageGenerator implements Agent<PageGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly pageArchitectPrompt: string,
        private readonly routerDesignerPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
        private readonly templates: Record<string, { id: string, name: string, description: string }[]>
    ) { }

    async think(userInput: string, context: AgentContext): Promise<PageGeneratorPlan> {
        let existingPageSchema: SchemaDto | null = null;
        let schemaId = '';

        // 1. Identification: Check if user input contains #schemaId:
        const idMatch = userInput.match(new RegExp(`${AGENT_TRIGGERS.PAGE_GENERATOR}#([^:]+):`));
        if (idMatch) {
            try {
                existingPageSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, idMatch[1] as string);
                schemaId = idMatch[1] as string;
                const pageName = existingPageSchema.settings?.page?.name || existingPageSchema.name;
                let message = `I am Page generator, I found the existing page "${pageName}". I will fetch the latest schema and help you modify it...`;
                if (existingPageSchema.publicationStatus === 'draft') {
                    message += "\n\n**Note: This page is currently a DRAFT. You should publish it to see the changes live.**";
                }
                await context.saveAssistantMessage(message);
            } catch (e) {
                this.logger.warn({ schemaId }, 'Existing page not found for modification');
                await context.saveAssistantMessage(`I am Page generator, I couldn't find the existing page with ID "${schemaId}". I will fetch the latest schema and generate a new page for you...`);
            }
        }

        // 2. Planning: Call Router Designer then Page Architect
        const metadataStr = existingPageSchema?.settings?.page?.metadata;
        let existingRoutingPlan: any = undefined;
        let existingArchitecture: any = undefined;

        if (metadataStr) {
            try {
                const metadata = JSON.parse(metadataStr);
                existingRoutingPlan = metadata.routingPlan;
                existingArchitecture = metadata.architecturePlan;
            } catch (e) {
                this.logger.warn({ metadataStr }, 'Failed to parse page metadata');
            }
        }

        const routingPlan = await this.planRouting(userInput, existingRoutingPlan);
        const queries = await this.cmsClient.getAllQueries(context.externalCookie);
        const architecturePlan = await this.planArchitecture(userInput, queries, routingPlan, existingArchitecture);

        await context.saveAssistantMessage(`I've planned the routing for "${routingPlan.pageName}" and the UI structure for your "${architecturePlan.pageType}" page.`);

        // 3. Context Gathering: Fetch selected Queries and their sample data
        const queryDetails = await Promise.all(architecturePlan.selectedQueries.map(async (sq: any) => {
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

        // Define templates based on page type
        let templates: { id: string, name: string, description: string }[] = [];

        if (architecturePlan.pageType === 'detail') {
            templates = this.templates['detail'] || [];
        } else {
            // Default to List/Index logic
            templates = this.templates['list'] || [];
        }

        return {
            userInput,
            routingPlan,
            architecturePlan,
            queryDetails,
            existingPageSchema,
            schemaId,
            providerName: context.providerName,
            templates: templates
        };
    }

    async act(plan: PageGeneratorPlan, context: AgentContext): Promise<void> {
        if (plan.architecturePlan.pageType === 'detail') {
            await context.onTemplateSelectionDetailToConfirm(plan);
        } else {
            await context.onTemplateSelectionListToConfirm(plan);
        }

        await context.saveAssistantMessage("I have analyzed your request. Please select a design template to proceed with generation.");
    }

    async handle(userInput: string, context: AgentContext): Promise<void> {
        try {
            const plan = await this.think(userInput, context);
            await this.act(plan, context);
        } catch (error: any) {
            await handleChatError(error, context, this.logger, "generating your HTML page");
        }
    }

    private async planRouting(userInput: string, existingPlan?: RoutingPlan): Promise<RoutingPlan> {
        let developerMessage = 'DETERMINE THE ROUTING STRUCTURE AND LINKING RULES.';

        if (existingPlan) {
            developerMessage += `\n\nEXISTING ROUTING PLAN:\n${JSON.stringify(existingPlan, null, 2)}\nPreserve the general structure unless changes are requested.`;
        }

        const response = await this.aiProvider.generate(
            this.routerDesignerPrompt,
            developerMessage,
            userInput
        );

        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as RoutingPlan;
        } catch (e) {
            console.error('Failed to parse RouterDesigner response:', response);
            return {
                pageName: `generated-page-${Date.now()}`,
                linkingRules: [],
                routerHints: 'Fallback to default naming'
            };
        }
    }

    private async planArchitecture(userInput: string, availableQueries: any[],
        routingPlan: RoutingPlan, existingArchitecture?: Partial<PageArchitecturePlan>): Promise<PageArchitecturePlan> {
        const queryListContext = availableQueries.map(q =>
            `- ${q.name}: ${q.settings?.query?.source}
             arguments: ${JSON.stringify(q.settings?.query?.arguments)}
            `).join('\n');

        let developerMessage = `
ROUTING PLAN:
- Planned Path: ${routingPlan.pageName}
- Parameters: ${routingPlan.primaryParameter || 'None'}
- Linking Rules: ${routingPlan.linkingRules.join(', ')}

AVAILABLE QUERIES:
${queryListContext}
`;

        if (existingArchitecture) {
            developerMessage += `\nEXISTING STRUCTURE:\n${JSON.stringify(existingArchitecture, null, 2)}\nPreserve the existing structure unless changes are requested.`;
        }

        developerMessage += '\n\nIDENTIFY THE PAGE TYPE AND PLAN THE STRUCTURE. Use the parameters from routing plan to select appropriate queries.';

        const response = await this.aiProvider.generate(
            this.pageArchitectPrompt,
            developerMessage,
            userInput
        );

        // Expecting JSON response as specified in prompt
        try {
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response as PageArchitecturePlan;
        } catch (e) {
            console.error('Failed to parse PageArchitect response:', response);
            // Fallback plan
            return {
                pageType: 'custom',
                layout: { hasHeader: true, hasSidebar: false, hasFooter: false, structure: 'Simple container' },
                selectedQueries: [
                    { queryName: 'fallback_query', fieldName: 'data', type: 'list', description: 'Default query', args: {} }
                ],
                components: [],
                architectureHints: 'Generate a basic layout'
            };
        }
    }
}

