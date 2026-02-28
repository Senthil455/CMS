import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from '../chat-assistant';
import { type AgentName, type ComponentInstruction, type PageAddonDefinition, type PageDto, type PageMetadata, type SaveSchemaPayload, type LayoutJson, LayoutCompiler } from '@cms/shared';
import { PageRepository } from '../../repositories/page-repository';

export interface AddonPlan {
    schemaId: string;
    pageDto: PageDto;
    layoutJson: LayoutJson;
    newComponent: { id: string; html: string };
}

export class PageAddonBuilder extends BaseAgent<AddonPlan> {

    constructor(
        private readonly addonDef: PageAddonDefinition,
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly snippet: string | undefined,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
    ) {
        super(`adding ${addonDef.label.toLowerCase()}`, logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext, componentInstruction?: ComponentInstruction): Promise<AddonPlan> {
        this.logger.info(`PageAddonBuilder[${this.addonDef.id}] think started`);

        // 1. Extract Schema ID
        let schemaId = context.schemaId;
        if (!schemaId) {
            const idMatch = userInput.match(/#([^:]+):/);
            schemaId = idMatch ? idMatch[1] : undefined;
        }

        if (!schemaId) {
            throw new Error("No page schema ID provided. Please provide the ID in the format #schemaId:");
        }

        await context.saveAgentMessage(`Accessing page (ID: ${schemaId}) to add ${this.addonDef.label}...`);

        // 2. Fetch Page
        const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!schema || schema.type !== 'page' || !schema.settings.page) {
            throw new Error(`Page schema not found or invalid type for ID: ${schemaId}`);
        }

        const pageDto = schema.settings.page;
        const metadata = schema.settings.page.metadata as PageMetadata;

        // 3. Build developer message with layoutJson + component IDs (no HTML)
        const existingLayoutJson = metadata.layoutJson || { sections: [] };
        const existingComponentIds = metadata.components ? Object.keys(metadata.components) : [];

        const developerMessage: Record<string, any> = {
            existingLayoutJson,
            existingComponentIds,
        };

        // Add snippet if available
        if (this.snippet) {
            const entityName = metadata.plan?.entityName || '';
            developerMessage[`${this.addonDef.id}Snippet`] = this.snippet.replace(/{{entityName}}/g, entityName);
        }

        // If the addon needs query details, fetch and attach them
        if (this.addonDef.needQueries) {
            const queryDetails = await this.fetchQueryDetails(metadata, context, componentInstruction);
            if (queryDetails) {
                developerMessage.queries = queryDetails;
                developerMessage.pageUrl = `/${pageDto.name}`;
            }
        }

        // If we have a component instruction from the architect, include it
        if (componentInstruction) {
            developerMessage.componentInstruction = componentInstruction.instruction;
        }

        await context.saveAgentMessage(`Planning layout for ${this.addonDef.label}...`);

        this.setLastPrompts(this.systemPrompt, JSON.stringify(developerMessage, null, 2), userInput);

        const res = await this.aiProvider.generate(
            this.systemPrompt,
            JSON.stringify(developerMessage, null, 2),
            userInput,
            parseModelFromProvider(context.providerName)
        );

        // Parse response: { layoutJson, component: { id, html } }
        let parsed: { layoutJson: LayoutJson; component: { id: string; html: string; addonId: string } };
        if (typeof res === 'string') {
            parsed = JSON.parse(res);
        } else {
            parsed = res as any;
        }
        parsed.component.addonId = this.addonDef.id;

        return {
            schemaId,
            pageDto,
            layoutJson: parsed.layoutJson,
            newComponent: parsed.component,
        };
    }

    async act(plan: AddonPlan, context: AgentContext): Promise<AgentResponse | null> {
        const { schemaId, pageDto, layoutJson, newComponent } = plan;

        const metadata = pageDto.metadata as PageMetadata;

        // Replace layoutJson
        metadata.layoutJson = layoutJson;

        // Append the new component to existing components
        if (!metadata.components) {
            metadata.components = {};
        }
        metadata.components[newComponent.id] = { html: newComponent.html };

        // Save the updated components and recompile HTML through PageRepository
        const pageManager = new PageRepository(this.cmsClient, this.logger, context.externalCookie);
        await pageManager.saveComponents(schemaId, layoutJson, metadata.components, pageDto.title);
        await context.saveAgentMessage(`Successfully added ${this.addonDef.label} to page "${pageDto.name}".`);
        await context.onSchemasSync({
            task_type: this.addonDef.agentName as AgentName,
            schemasId: [schemaId]
        });
        return null;
    }

    /**
     * Fetch query details with variable info for addons that need it (e.g. search bar).
     * If componentInstruction is set, use its queriesToUse; otherwise use all page queries.
     */
    private async fetchQueryDetails(metadata: PageMetadata, context: AgentContext, componentInstruction?: ComponentInstruction) {
        const selectedQueries = metadata.architecture?.selectedQueries || [];
        if (selectedQueries.length === 0) return null;

        // Filter queries if we have a component instruction with specific queries
        const queriesToFetch = componentInstruction?.queriesToUse?.length
            ? selectedQueries.filter(sq => componentInstruction!.queriesToUse.includes(sq.queryName))
            : selectedQueries;

        if (queriesToFetch.length === 0) return null;

        // Fetch full query schemas to get variable details
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
