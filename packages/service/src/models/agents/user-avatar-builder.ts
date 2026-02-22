import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-assistant';
import { AGENT_NAMES, type PageDto, type SaveSchemaPayload, type PageMetadata } from '@cms/shared';

export interface UserAvatarPlan {
    schemaId: string;
    pageDto: PageDto;
}

export class UserAvatarBuilder extends BaseAgent<UserAvatarPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly userAvatarSnippet: string,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
    ) {
        super("adding user avatar", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<UserAvatarPlan> {
        this.logger.info('UserAvatarBuilder think started');

        let schemaId = context.schemaId;
        if (!schemaId) {
            const idMatch = userInput.match(/#([^:]+):/);
            schemaId = idMatch ? idMatch[1] : undefined;
        }

        if (!schemaId) {
            throw new Error("No page schema ID provided. Please provide the ID in the format #schemaId:");
        }

        await context.saveAgentMessage(`Accessing page (ID: ${schemaId}) to add user avatar...`);

        const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
        if (!schema || schema.type !== 'page' || !schema.settings.page) {
            throw new Error(`Page schema not found or invalid type for ID: ${schemaId}`);
        }

        const pageDto = schema.settings.page;

        const developerMessage = JSON.stringify({
            existingHtml: pageDto.html,
            userAvatarSnippet: this.userAvatarSnippet
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

    async act(plan: UserAvatarPlan, context: AgentContext): Promise<AgentResponse | null> {
        const { schemaId, pageDto } = plan;

        const metadata = JSON.parse(pageDto.metadata) as PageMetadata;
        metadata.enableUserAvatar = true;

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
        await context.saveAgentMessage(`Successfully added User Avatar to page "${pageDto.name}".`);
        await context.onSchemasSync({
            task_type: AGENT_NAMES.USER_AVATAR_BUILDER,
            schemasId: [schemaId]
        });
        return null;
    }
}
