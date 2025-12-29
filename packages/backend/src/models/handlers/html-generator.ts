import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';

export class HtmlGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am HTML generator, I am fetching the latest schema and generating your page...');

            // 1. Fetch SDL and Queries to provide context to the AI
            const [sdl, queries] = await Promise.all([
                this.cmsClient.generateSDL(context.externalCookie),
                this.cmsClient.getAllQueries(context.externalCookie)
            ]);

            const queryText = queries
                .filter(q => q.settings?.query)
                .map(q => `endpoint: /api/quries/${q.settings.query!.name} graphQL source ${q.settings.query!.source}`)
                .join('\n');

            const developerMessage = `
                AVAILABLE QUERY ENDPOINTS:\n${queryText}
            `.trim();

            // 2. Call AI Agent to generate HTML
            const htmlContent: string = await this.aiAgent.generate(
                this.systemPrompt,
                developerMessage,
                userInput
            );

            // Save AI response to database log
            await context.saveAiResponseLog('html-generator',
                JSON.stringify({ content: htmlContent, taskType: context.taskType })
            );

            // 3. Send the generated HTML as a message
            // Since the system prompt says "Output ONLY raw HTML", we can just send it.
            await context.saveAssistantMessage(htmlContent);

        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in HtmlGenerator handle');
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            await context.saveAssistantMessage(`I'm sorry, I encountered an error while generating your HTML page:\n${errorMessage}`);
        }
    }
}
