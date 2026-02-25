import type { AIProvider } from '../../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../../infrastructures/cms-client';
import type { ServiceLogger } from '../../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, AgentStopError, parseModelFromProvider } from '../chat-assistant';
import { type AgentName, type PageAddonDefinition, type PageMetadata, type SaveSchemaPayload, type LayoutJson, LayoutCompiler } from '@cms/shared';
import { PageManager } from '../../cms/page-manager';
import type { AddonPlan } from './PageAddonBuilder';

export class SearchBarAddonBuilder extends BaseAgent<AddonPlan> {
    constructor(
        private readonly addonDef: PageAddonDefinition,
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        _snippet: string | undefined, // unused — search bar generates form from query variables
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
    ) {
        super(`adding ${addonDef.label.toLowerCase()}`, logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<AddonPlan> {
        this.logger.info(`SearchBarAddonBuilder think started`);

        // 1. Extract Schema ID
        let schemaId = context.schemaId;
        if (!schemaId) {
            const idMatch = userInput.match(/#([^:]+):/);
            schemaId = idMatch ? idMatch[1] : undefined;
        }

        if (!schemaId) {
            throw new AgentStopError("No page schema ID provided. Please provide the ID in the format #schemaId:");
        }

        await context.saveAgentMessage(`Accessing page (ID: ${schemaId}) to add ${this.addonDef.label}...`);

        // 2. Fetch Page
        const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!schema || schema.type !== 'page' || !schema.settings.page) {
            throw new AgentStopError(`Page schema not found or invalid type for ID: ${schemaId}`);
        }

        const pageDto = schema.settings.page;
        const metadata = pageDto.metadata as PageMetadata;

        // 3. Get query info from the page's architecture
        const selectedQueries = metadata.architecture?.selectedQueries || [];
        if (selectedQueries.length === 0) {
            throw new AgentStopError("This page has no queries configured. A search bar requires at least one query with variables.");
        }

        // 4. Fetch full query schemas to get variable details
        const allSchemas = await this.cmsClient.getAllEntities(context.externalCookie);
        const querySchemas = allSchemas.filter((s: any) => s.type === 'query');

        const queriesWithVars = selectedQueries.map(sq => {
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

        // Check if any query has filterable variables
        const hasVariables = queriesWithVars.some(q => q.variables.length > 0);
        if (!hasVariables) {
            throw new AgentStopError("None of the page's queries have filter variables. A search bar requires queries with variables like category, name, etc.");
        }

        // 5. Build developer message
        const existingLayoutJson = metadata.layoutJson || { sections: [] };
        const existingComponentIds = metadata.components ? Object.keys(metadata.components) : [];
        const pageUrl = `/${pageDto.name}`;

        const developerMessage: Record<string, any> = {
            existingLayoutJson,
            existingComponentIds,
            pageUrl,
            queries: queriesWithVars,
        };

        await context.saveAgentMessage(`Generating search form based on ${queriesWithVars.length} query(ies)...`);

        this.setLastPrompts(this.systemPrompt, JSON.stringify(developerMessage, null, 2), userInput);

        const res = await this.aiProvider.generate(
            this.systemPrompt,
            JSON.stringify(developerMessage, null, 2),
            userInput,
            parseModelFromProvider(context.providerName)
        );

        // Parse response
        let parsed: { layoutJson: LayoutJson; component: { id: string; html: string } };
        if (typeof res === 'string') {
            parsed = JSON.parse(res);
        } else {
            parsed = res as any;
        }

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

        // Append the new component
        if (!metadata.components) {
            metadata.components = {};
        }
        metadata.components[newComponent.id] = { html: newComponent.html };

        // Save and recompile
        const pageManager = new PageManager(this.cmsClient, this.logger, context.externalCookie);
        await pageManager.saveComponents(schemaId, layoutJson, metadata.components, pageDto.title);
        await context.saveAgentMessage(`Successfully added ${this.addonDef.label} to page "${pageDto.name}".`);
        await context.onSchemasSync({
            task_type: this.addonDef.agentName as AgentName,
            schemasId: [schemaId]
        });
        return null;
    }
}
