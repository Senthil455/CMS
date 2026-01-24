import type { AIProvider } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleAgentError } from './chat-agent';

import { AGENT_NAMES } from '@cms/shared';
// ... existing interface ...
export interface DataGeneratorResponse {
    entityName: string;
    data: any[];
}

export interface DataGeneratorPlan extends DataGeneratorResponse {
    targetEntity?: any;
    entities: any[];
}

export class DataGenerator implements Agent<DataGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async think(userInput: string, context: AgentContext): Promise<DataGeneratorPlan> {
        await context.saveAssistantMessage('I am data generator, I am fetching the latest schema and generating your data...');

        // 1. Fetch Schema
        let entities: any[] = [];
        let specificEntityName: string | undefined;

        // Try to parse schemaId from input
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.DATA_GENERATOR}#([^:]+):`));

        if (idMatch) {
            const schemaId = idMatch[1];
            try {
                const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId as string);
                if (schema && schema.settings.entity) {
                    specificEntityName = schema.settings.entity.name;
                    const xEntity = await this.cmsClient.getXEntity(context.externalCookie, specificEntityName);
                    entities = [xEntity];
                    await context.saveAssistantMessage(`I found the entity "${specificEntityName}". Generating data based on its schema...`);
                } else {
                    // Fallback if schema/entity not found
                    entities = await this.cmsClient.getAllXEntity(context.externalCookie);
                }
            } catch (e) {
                this.logger.warn({ schemaId, error: e }, 'Failed to fetch specific schema for data generation');
                entities = await this.cmsClient.getAllXEntity(context.externalCookie);
            }
        } else {
            entities = await this.cmsClient.getAllXEntity(context.externalCookie);
        }

        // 2. Call AI Agent to generate data
        const response: DataGeneratorResponse = await this.aiProvider.generate(
            this.systemPrompt,
            `\nSCHEMA DEFINITION:\n${JSON.stringify(entities, null, 2)}`,
            userInput
        );

        const { entityName, data } = response;
        let targetEntity: any = undefined;

        if (entityName && Array.isArray(data) && data.length > 0) {
            targetEntity = entities.find(e => e.name === entityName);
        }

        return {
            ...response,
            entities,
            targetEntity
        };
    }

    async act(plan: DataGeneratorPlan, context: AgentContext): Promise<void> {
        const { entityName, data, targetEntity } = plan;

        if (!entityName || !Array.isArray(data) || data.length === 0) {
            await context.saveAssistantMessage('I could not generate any data. Please make sure the entity exists and your request is clear.');
            return;
        }

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
    }

    async handle(userInput: string, context: AgentContext): Promise<void> {
        try {
            const plan = await this.think(userInput, context);

            // Save AI response to database log
            await context.saveAiResponseLog(AGENT_NAMES.DATA_GENERATOR,
                JSON.stringify({ ...plan, taskType: context.taskType })
            );

            await this.act(plan, context);
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your data", this.aiProvider);
        }
    }
}