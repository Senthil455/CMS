import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext, handleChatError } from './chat-handler';

export interface DataGeneratorResponse {
    entityName: string;
    data: any[];
}

export class DataGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am data generator, I am fetching the latest schema and generating your data...');

            // 1. Fetch Schema
            const entities = await this.cmsClient.getAllXEntity(context.externalCookie);

            // 2. Call AI Agent to generate data
            const response: DataGeneratorResponse = await this.aiAgent.generate(
                this.systemPrompt,
                `\nSCHEMA DEFINITION:\n${JSON.stringify(entities, null, 2)}`,
                userInput
            );

            // Save AI response to database log
            await context.saveAiResponseLog('data-generator',
                JSON.stringify({ ...response, taskType: context.taskType })
            );

            const { entityName, data } = response;

            if (!entityName || !Array.isArray(data) || data.length === 0) {
                await context.saveAssistantMessage('I could not generate any data. Please make sure the entity exists and your request is clear.');
                return;
            }

            const targetEntity = entities.find(e => e.name === entityName);
            if (!targetEntity) {
                await context.saveAssistantMessage(`I could not find the entity "${entityName}" in the schema definition.`);
                return;
            }

            await context.saveAssistantMessage(`Generated ${data.length} items for "${entityName}". Inserting into CMS...`);

            // 3. Insert data into CMS
            let successCount = 0;
            const idMaps: Record<string, Record<string, any>> = {};
            for (const item of data) {
                try {
                    await this.cmsClient.insertData(context.externalCookie, targetEntity, item, idMaps);
                    successCount++;
                } catch (e) {
                    this.logger.error({ error: e, item }, 'Failed to insert item');
                }
            }

            await context.saveAssistantMessage(`Successfully inserted ${successCount} out of ${data.length} items for "${entityName}".`);

        } catch (error: any) {
            await handleChatError(error, context, this.logger, "generating or inserting your data");
        }
    }
}
