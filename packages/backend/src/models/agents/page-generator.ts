import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleAgentError } from './chat-agent';
import { type SaveSchemaPayload, type SchemaDto, type TemplateSelectionRequest, type TemplateSelectionResponse, AGENT_NAMES } from '@cms/shared';
import type { AIProvider } from '../../infrastructures/agent.interface';
import { RouterDesigner, type RoutingPlan } from '../planners/router-designer';
import { PageArchitect, type PageArchitecturePlan } from '../planners/page-architect';

export interface PageGeneratorPlan extends TemplateSelectionRequest {
    // TemplateSelectionRequest already contains: userInput, routingPlan, architecturePlan, queryDetails, existingPageSchema, schemaId, providerName, templates
}

export class PageGenerator implements Agent<PageGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly routerDesigner: RouterDesigner,
        private readonly pageArchitect: PageArchitect,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
        private readonly templates: Record<string, { id: string, name: string, description: string }[]>
    ) { }

    async think(userInput: string, context: AgentContext): Promise<PageGeneratorPlan> {
        let existingPageSchema: SchemaDto | null = null;
        let schemaId = '';

        // 1. Identification: Check if user input contains #schemaId:
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.PAGE_GENERATOR}#([^:]+):`));
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

        const routingPlan = await this.routerDesigner.plan(userInput, context, existingRoutingPlan);
        const queries = await this.cmsClient.getAllQueries(context.externalCookie);
        const architecturePlan = await this.pageArchitect.plan(userInput, context, queries, routingPlan, existingArchitecture);

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
            await handleAgentError(error, context, this.logger, "generating your page", this.aiProvider);
        }
    }
}

