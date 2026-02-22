import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-assistant';
import { AGENT_NAMES, type PageDto, type PageMetadata, type SaveSchemaPayload } from '@cms/shared';

export interface EngagementBarPlan {
    schemaId: string;
    pageDto: PageDto;
}

export class PageEngagementBarBuilder extends BaseAgent<EngagementBarPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly engagementBarSnippet: string,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
    ) {
        super("adding engagement bar", logger, aiProvider);
    }

    public getSnippet(): string {
        return this.engagementBarSnippet;
    }

    async think(userInput: string, context: AgentContext): Promise<EngagementBarPlan> {
        this.logger.info('PageEngagementBarBuilder think started');

        // 1. Extract Schema ID
        let schemaId = context.schemaId;
        if (!schemaId) {
            const idMatch = userInput.match(/#([^:]+):/);
            schemaId = idMatch ? idMatch[1] : undefined;
        }

        if (!schemaId) {
            throw new Error("No page schema ID provided. Please provide the ID in the format #schemaId:");
        }

        await context.saveAgentMessage(`I am correctly connected. Accessing page (ID: ${schemaId})...`);

        // 2. Fetch Page
        const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!schema || schema.type !== 'page' || !schema.settings.page) {
            throw new Error(`Page schema not found or invalid type for ID: ${schemaId}`);
        }

        const pageDto = schema.settings.page;
        const metadata = JSON.parse(schema.settings.page.metadata) as PageMetadata;

        const developerMessage = JSON.stringify({
            existingHtml: pageDto.html,
            engagementBarSnippet: this.engagementBarSnippet.replace(/{{entityName}}/g, metadata.plan?.entityName || '')
        }, null, 2);

        const res = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
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

    async act(plan: EngagementBarPlan, context: AgentContext): Promise<AgentResponse | null> {
        const { schemaId, pageDto } = plan;

        const metadata = JSON.parse(pageDto.metadata) as PageMetadata;
        metadata.enableEngagementBar = true;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageDto,
                    metadata: JSON.stringify(metadata)
                }
            }
        };

        await this.cmsClient.saveSchema(context.externalCookie, payload);
        await context.saveAgentMessage(`Successfully added Engagement Bar to page "${pageDto.name}".`);
        await context.onSchemasSync({
            task_type: AGENT_NAMES.PAGE_ENGAGEMENT_BAR_BUILDER,
            schemasId: [schemaId]
        });
        return null;
    }
}
