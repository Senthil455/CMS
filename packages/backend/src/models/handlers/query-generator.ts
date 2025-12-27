import { object } from 'zod/v4';
import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';
import { type QueryResponse } from '@cms/shared';

export class QueryGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am query generator, I am fetching the latest schema and generating your query...');

            // 1. Fetch SDL
            const sdl = await this.cmsClient.generateSDL(context.externalCookie);

            // 2. Call AI Agent to generate GraphQL query
            // Developer message is set as SDL
            const queryResponse: QueryResponse = await this.aiAgent.generate(
                this.systemPrompt,
                `GRAPHQL SDL:\n${sdl}`,
                userInput
            );

            // Save AI response to database log
            await context.saveAiResponseLog('query-generator', JSON.stringify({ query: queryResponse, taskType: context.taskType }));

            for (const source of Object.values(queryResponse.query)) {

                await context.saveAssistantMessage(`Executing generated query:\n${source}`);

                // 3. Execute query against CMS
                const resp = await this.cmsClient.query(context.externalCookie, source);

                await context.saveAssistantMessage('Query executed successfully.');
            }



        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in QueryGenerator handle');
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            await context.saveAssistantMessage(`I'm sorry, I encountered an error while generating or executing your query:\n${errorMessage}`);
        }
    }
}
