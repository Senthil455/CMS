import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext, handleChatError } from './chat-handler';
import { type QueryResponse, type SchemaDto } from '@cms/shared';

export class QueryGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            let existingQuerySchema: SchemaDto | null = null;
            let schemaId = '';

            // Check if user input contains #queryName
            const queryNameMatch = userInput.match(/#([a-zA-Z0-9-_]+)/);
            if (queryNameMatch) {
                const queryName = queryNameMatch[1] as string;
                try {
                    existingQuerySchema = await this.cmsClient.getSchemaByName(context.externalCookie, queryName, 'query');
                    schemaId = existingQuerySchema.schemaId;
                    await context.saveAssistantMessage(`I am Query generator, I found the existing query "${queryName}". I will fetch the latest schema and help you modify it...`);
                } catch (e) {
                    this.logger.warn({ queryName }, 'Existing query not found for modification');
                    await context.saveAssistantMessage(`I am Query generator, I couldn't find the existing query "${queryName}". I will fetch the latest schema and generate a new query for you...`);
                }
            } else {
                await context.saveAssistantMessage('I am query generator, I am fetching the latest schema and generating your query...');
            }

            // 1. Fetch SDL
            const sdl = await this.cmsClient.generateSDL(context.externalCookie);

            let developerMessage = `\nGRAPHQL SDL:\n${sdl}`;
            if (existingQuerySchema && existingQuerySchema.settings?.query) {
                developerMessage += `\n\nEXISTING QUERY CONTENT FOR "${existingQuerySchema.settings.query.name}":\n${existingQuerySchema.settings.query.source}`;
            }

            // 2. Call AI Agent to generate GraphQL query
            // Developer message is set as SDL + existing query if any
            const queryResponse: QueryResponse = await this.aiAgent.generate(
                this.systemPrompt,
                developerMessage,
                userInput
            );

            // Save AI response to database log
            await context.saveAiResponseLog('query-generator',
                JSON.stringify({ ...queryResponse, taskType: context.taskType })
            );

            const schemaIds: string[] = [];

            for (const [name, source] of Object.entries(queryResponse.queries)) {

                await context.saveAssistantMessage(`Executing generated query "${name}":\n${source}`);

                // Determine schemaId to use if we are editing
                let targetSchemaId = '';
                if (existingQuerySchema && (existingQuerySchema.settings?.query?.name === name || queryNameMatch && queryNameMatch[1] === name)) {
                    targetSchemaId = schemaId;
                }

                // 3. Execute query against CMS
                const newSchemaId = await this.cmsClient.saveQuery(context.externalCookie, targetSchemaId, name, source);
                schemaIds.push(newSchemaId);

                await context.saveAssistantMessage(`Query "${name}" executed successfully.`);
            }

            if (schemaIds.length > 0) {
                await context.onSchemasSync({
                    task_type: 'query_generator',
                    schemasId: schemaIds
                });
            }


        } catch (error: any) {
            await handleChatError(error, context, this.logger, "generating or executing your query");
        }
    }
}
