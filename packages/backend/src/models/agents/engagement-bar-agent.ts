import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent } from './chat-agent';
import { AGENT_NAMES, type PageDto, type PageMetadata, type SaveSchemaPayload } from '@cms/shared';

export interface EngagementBarPlan {
    schemaId: string;
    pageDto: PageDto;
}

export class EngagementBarAgent extends BaseAgent<EngagementBarPlan> {
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
        this.logger.info('EngagementBarAgent think started');

        // 1. Extract Schema ID
        const idMatch = userInput.match(/#([^:]+):/);
        const schemaId = idMatch ? idMatch[1] : null;

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

        const developerMessage = `
EXISTING HTML:
${pageDto.html}

ENGAGEMENT BAR SNIPPET TEMPLATE:
${this.engagementBarSnippet}
`;

        const newHtml = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput
        );

        let cleanedHtml = newHtml;
        if (typeof newHtml === 'string') {
            cleanedHtml = newHtml.replace(/```html/g, '').replace(/```/g, '').trim();
        }

        return {
            schemaId,
            pageDto: {
                ...pageDto,
                html: cleanedHtml
            }
        };
    }

    async act(plan: EngagementBarPlan, context: AgentContext): Promise<AgentResponse | null> {
        const { schemaId, pageDto } = plan;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: pageDto
            }
        };

        await this.cmsClient.saveSchema(context.externalCookie, payload);
        await context.saveAgentMessage(`Successfully added Engagement Bar to page "${pageDto.name}".`);
        await context.onSchemasSync({
            task_type: AGENT_NAMES.ENGAGEMENT_BAR_AGENT,
            schemasId: [schemaId]
        });
        return null;
    }
}
