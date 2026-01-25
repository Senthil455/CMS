import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent } from './chat-agent';
import { AGENT_NAMES, type PageDto, type SaveSchemaPayload } from '@cms/shared';

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
        super(AGENT_NAMES.ENGAGEMENT_BAR_AGENT, "adding engagement bar", logger, aiProvider);
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

        await context.saveAssistantMessage(`I am correctly connected. Accessing page (ID: ${schemaId})...`);

        // 2. Fetch Page
        const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!schema || schema.type !== 'page' || !schema.settings.page) {
            throw new Error(`Page schema not found or invalid type for ID: ${schemaId}`);
        }

        const pageDto = schema.settings.page;
        const metadataStr = pageDto.metadata;
        let entityName = 'unknown_entity';

        // Try to find entity name from metadata
        if (metadataStr) {
            try {
                const metadata = JSON.parse(metadataStr);
                // Look for entity in architecture plan or routing plan hints
                if (metadata.routingPlan && metadata.routingPlan.pageName) {
                    // Start guessing or extract from somewhere reliable
                    // Often pageName is "Entity Detail" or similar.
                    // But better: checks routing parameters?
                }
                // If the user selected an entity for this page, it might be in query?
            } catch (e) {
                // Ignore
            }
        }

        const developerMessage = `
EXISTING HTML:
${pageDto.html}

ENGAGEMENT BAR SNIPPET TEMPLATE:
${this.engagementBarSnippet}

INSTRUCTIONS:
1. Inject the engagement bar snippet into the HTML. 
2. If you can determine the entity name from the HTML or context (e.g. if the page is for 'articles'), replace {{entityName}} with that name (lowercase, plural if API expects it, but usually singular or plural depending on your API convention - default to plural).
   - If user input mentions the entity, use that.
   - If not sure, leave as {{entityName}} or use 'entities'.
3. Leave {{recordId}} as is, because this will be populated by the frontend router/context at runtime (e.g. AlpineJS data binding).
   - If the snippet uses AlpineJS "fetch('/api/engagements/{{entityName}}/{{recordId}}')", ensure {{recordId}} is replaced by the AlpineJS variable for the ID (e.g. '\${id}' or similar) IF the page uses a specific variable. 
   - However, the snippet instructions say "Replace {{entityName}} and {{recordId}} with actual values". 
   - Since this is a template generated code, likely we want Handlebars syntax {{...}} to remain if it's a server-rendered template, OR Alpine syntax if client-side.
   - The snippet provided uses Handlebars-style {{entityName}}. Preserve it if unsure.
   
   IMPORTANT: Return ONLY the modified HTML.
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

        await context.saveAssistantMessage(`Successfully added Engagement Bar to page "${pageDto.name}".`);

        await context.onSchemasSync({
            task_type: AGENT_NAMES.ENGAGEMENT_BAR_AGENT,
            schemasId: [schemaId]
        });
        return null;
    }
}
