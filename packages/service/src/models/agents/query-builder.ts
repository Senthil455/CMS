import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-assistant';
import { type QueryResponse, type SchemaDto, type SaveSchemaPayload, AGENT_NAMES } from '@cms/shared';

export interface QueryGeneratorPlan extends QueryResponse {
    schemaId?: string;
    existingSchema: SchemaDto | null;
}

export class QueryGenerator extends BaseAgent<QueryGeneratorPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
    ) {
        super("generating your query", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<QueryGeneratorPlan> {
        let existingSchema: SchemaDto | null = null;
        let schemaId = '';

        // 1. Identification: Check if user input contains #schemaId:
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.QUERY_BUILDER}#([^:]+):`));
        if (idMatch) {
            try {
                existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, idMatch[1] as string);
                schemaId = idMatch[1] as string;
                if (existingSchema && existingSchema.type === 'query') {
                    const qName = existingSchema.name;
                    await context.saveAgentMessage(`I found the existing query "${qName}". I will fetch the latest schema and help you modify it...`);
                }
            } catch (e) {
                this.logger.warn({ schemaId }, 'Existing query not found for modification');
                await context.saveAgentMessage(`I couldn't find the existing query with ID "${schemaId}". I will generate a new query for you...`);
            }
        }

        const sdl = await this.cmsClient.generateSDL(context.externalCookie);

        let developerMessage = `## GraphQL SDL Schema
${sdl}
`;
        if (existingSchema && existingSchema.type === 'query') {
            developerMessage += `\n\nExisting Query to Modify:\n${JSON.stringify(existingSchema.settings.query, null, 2)}`;
        }

        const response: QueryResponse = await this.aiProvider.generate(
            this.systemPrompt,
            developerMessage,
            userInput,
            parseModelFromProvider(context.providerName)
        );

        return {
            ...response,
            schemaId,
            existingSchema
        };
    }

    async act(plan: QueryGeneratorPlan, context: AgentContext): Promise<AgentResponse | null> {

        if (!plan.queries || Object.keys(plan.queries).length === 0) {
            await context.saveAgentMessage("I couldn't generate a valid query configuration. Please try again with more details.");
            return null;
        }

        const schemaIds: string[] = [];

        for (const [name, source] of Object.entries(plan.queries)) {
            await context.saveAgentMessage(`Executing generated query "${name}":\n${source}`);

            let targetSchemaId = '';
            // If we are editing, check if name matches
            if (plan.existingSchema && (plan.existingSchema.name === name || plan.existingSchema.settings?.query?.name === name)) {
                targetSchemaId = plan.schemaId || '';
            }

            // We need to saveQuery which internally does saveSchema.
            // But CmsClient.saveQuery helper simplifies this.
            try {
                const newSchemaId = await this.cmsClient.saveQuery(context.externalCookie, targetSchemaId, name, source);
                schemaIds.push(newSchemaId);
            } catch (e: any) {
                this.logger.error({ error: e }, 'Failed to save query');
                await context.saveAgentMessage(`Failed to save query "${name}".`);
            }
        }

        if (schemaIds.length > 0) {
            await context.onSchemasSync({
                task_type: 'query_builder',
                schemasId: schemaIds
            });
            const finalMessage = plan.existingSchema
                ? `I have updated the queries, you can view them in CMS.`
                : `I have generated the queries, you can find them in CMS.`;
            await context.saveAgentMessage(finalMessage);
        }
        return null;
    }
}
