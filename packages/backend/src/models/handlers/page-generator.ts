import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';
import { type SaveSchemaPayload, type SchemaDto } from '@cms/shared';

export class PageGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly baseUrl: string,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            let existingPageSchema: SchemaDto | null = null;
            let schemaId = '';

            // Check if user input contains #pageName
            const pageNameMatch = userInput.match(/#([a-zA-Z0-9-_]+)/);
            if (pageNameMatch) {
                const pageName = pageNameMatch[1] as string;
                try {
                    existingPageSchema = await this.cmsClient.getSchemaByName(context.externalCookie, pageName, 'page');
                    schemaId = existingPageSchema.schemaId;
                    await context.saveAssistantMessage(`I am Page generator, I found the existing page "${pageName}". I will fetch the latest schema and help you modify it...`);
                } catch (e) {
                    this.logger.warn({ pageName }, 'Existing page not found for modification');
                    await context.saveAssistantMessage(`I am Page generator, I couldn't find the existing page "${pageName}". I will fetch the latest schema and generate a new page for you...`);
                }
            } else {
                await context.saveAssistantMessage('I am Page generator, I am fetching the latest schema and generating your page...');
            }

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

            let developerMessage = queryDetails.join('\n');
            if (existingPageSchema && existingPageSchema.settings.page) {
                const p = existingPageSchema.settings.page;
                developerMessage += `\n\nEXISTING PAGE CONTENT:\n${JSON.stringify({
                    name: p.name,
                    title: p.title,
                    html: p.html
                }, null, 2)}`;
            }

            // 2. Call AI Agent to generate HTML
            const aiResponse = await this.aiAgent.generate(
                this.systemPrompt,
                developerMessage,
                userInput
            );

            // Save AI response to database log
            await context.saveAiResponseLog('page-generator',
                JSON.stringify({ ...aiResponse, taskType: context.taskType })
            );

            let { html, name, title } = aiResponse;
            name = name || (existingPageSchema?.name) || `generated-page-${Date.now()}`;
            title = title || (existingPageSchema?.settings.page?.title) || 'Generated Page';

            // Save the generated page to CMS
            try {
                const payload: SaveSchemaPayload = {
                    schemaId,
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
                const saveResp = await this.cmsClient.saveSchema(context.externalCookie, payload);
                const newSchemaId = saveResp.data.schemaId;

                this.logger.info({ name, schemaId: newSchemaId }, 'Successfully saved generated page to CMS');

                if (newSchemaId) {
                    await context.onSchemasSync({
                        task_type: 'page_generator',
                        schemasId: [newSchemaId]
                    });
                }


            } catch (saveError) {
                this.logger.error({ error: saveError }, 'Failed to save generated page to CMS');
            }


            // 3. Send the generated HTML as a message
            const finalMessage = existingPageSchema
                ? `I have updated the page "${name}", you can view it in CMS.`
                : "I have generated your HTML page, you can find it in CMS.";
            await context.saveAssistantMessage(finalMessage);

        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in PageGenerator handle');
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            await context.saveAssistantMessage(`I'm sorry, I encountered an error while generating your HTML page:\n${errorMessage}`);
        }
    }
}
