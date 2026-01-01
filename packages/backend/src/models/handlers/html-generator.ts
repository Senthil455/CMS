import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';
import { type SaveSchemaPayload } from '@cms/shared';

export class HtmlGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am HTML generator, I am fetching the latest schema and generating your page...');

            // 1. Fetch Queries and their sample data to provide context to the AI
            const queries = await this.cmsClient.getAllQueries(context.externalCookie);

            const queryDetails = await Promise.all(queries.filter(q => q.settings?.query).map(async (q) => {
                const queryName = q.settings.query!.name;
                try {
                    const sampleData = await this.cmsClient.requestQuery(context.externalCookie, queryName);
                    return `ENDPOINTS: ${this.baseUrl}/api/queries/${queryName} 
                        REFERENCE RESPONSE SHAPE (DO NOT OUTPUT): ${JSON.stringify(sampleData)}`;
                } catch (e) {
                    return `ENDPOINTS: ${this.baseUrl}/api/queries/${queryName}`;
                }
            }))

            // 2. Call AI Agent to generate HTML
            const aiResponse = await this.aiAgent.generate(
                this.systemPrompt,
                queryDetails.join('\n'),
                userInput
            );

            // Save AI response to database log
            await context.saveAiResponseLog('html-generator',
                JSON.stringify({ ...aiResponse, taskType: context.taskType })
            );

            let { html, name, title } = aiResponse;
            name = name || `generated-page-${Date.now()}`;
            title = title || 'Generated Page';

            // Save the generated page to CMS
            try {
                const payload: SaveSchemaPayload = {
                    schemaId: null,
                    type: 'page',
                    settings: {
                        page: {
                            name,
                            title,
                            html,
                            css: '',
                            components: '',
                            styles: '',
                            query: ''
                        }
                    }
                };
                await this.cmsClient.savePage(context.externalCookie, payload);
                this.logger.info({ name }, 'Successfully saved generated page to CMS');
            } catch (saveError) {
                this.logger.error({ error: saveError }, 'Failed to save generated page to CMS');
            }


            // 3. Send the generated HTML as a message
            await context.saveAssistantMessage("I have generated your HTML page, you can find it in CMS.");

        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in HtmlGenerator handle');
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            await context.saveAssistantMessage(`I'm sorry, I encountered an error while generating your HTML page:\n${errorMessage}`);
        }
    }
}
