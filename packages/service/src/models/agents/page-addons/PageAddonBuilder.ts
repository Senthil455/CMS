import type { AIProvider } from '../../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../../infrastructures/cms-client';
import type { ServiceLogger } from '../../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from '../chat-assistant';
import { type AgentName, type PageAddonDefinition, type PageDto, type PageMetadata, type SaveSchemaPayload } from '@cms/shared';

export interface AddonPlan {
    schemaId: string;
    pageDto: PageDto;
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

    async think(userInput: string, context: AgentContext): Promise<AddonPlan> {
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

        // 3. Build developer message
        const developerMessage: Record<string, string> = {
            existingHtml: pageDto.html,
        };

        if (this.snippet) {
            const entityName = metadata.plan?.entityName || '';
            developerMessage[`${this.addonDef.id}Snippet`] = this.snippet.replace(/{{entityName}}/g, entityName);
        }

        this.setLastPrompts(this.systemPrompt, JSON.stringify(developerMessage, null, 2), userInput);

        const res = await this.aiProvider.generate(
            this.systemPrompt,
            JSON.stringify(developerMessage, null, 2),
            userInput,
            parseModelFromProvider(context.providerName)
        );

        return {
            schemaId,
            pageDto: {
                ...pageDto,
                html: res.html
            }
        };
    }

    async act(plan: AddonPlan, context: AgentContext): Promise<AgentResponse | null> {
        const { schemaId, pageDto } = plan;

        const metadata = pageDto.metadata as PageMetadata;
        // Set the metadata flag dynamically
        (metadata as any)[this.addonDef.metadataFlag] = true;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageDto,
                    metadata: metadata
                }
            }
        };

        await this.cmsClient.saveSchema(context.externalCookie, payload);
        await context.saveAgentMessage(`Successfully added ${this.addonDef.label} to page "${pageDto.name}".`);
        await context.onSchemasSync({
            task_type: this.addonDef.agentName as AgentName,
            schemasId: [schemaId]
        });
        return null;
    }
}
