import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type AgentContext, type AgentResponse, BaseAgent, parseModelFromProvider } from './chat-agent';

import { AGENT_NAMES } from '@cms/shared';

export interface DataGeneratorResponse {
    entityName: string;
    data: any[];
}

export interface DataGeneratorPlan extends DataGeneratorResponse {
    targetEntity?: any;
    entities: any[];
}

export class DataGenerator extends BaseAgent<DataGeneratorPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
    ) {
        super("generating your data", logger, aiProvider);
    }

    async think(userInput: string, context: AgentContext): Promise<DataGeneratorPlan> {
        await context.saveAgentMessage('I am data generator, I am fetching the latest schema and generating your data...');
        await context.updateStatus('Fetching latest schemas for data generation...');

        let entities: any[] = [];
        let specificEntityName: string | undefined;

        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.DATA_GENERATOR}#([^:]+):`));

        if (idMatch) {
            const schemaId = idMatch[1];
            try {
                const schema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId as string);
                if (schema && schema.settings.entity) {
                    specificEntityName = schema.settings.entity.name;
                    const xEntity = await this.cmsClient.getXEntity(context.externalCookie, specificEntityName);
                    entities = [xEntity];
                    await context.saveAgentMessage(`I found the entity "${specificEntityName}". Generating data based on its schema...`);
                } else {
                    entities = await this.cmsClient.getAllXEntity(context.externalCookie);
                }
            } catch (e) {
                this.logger.warn({ schemaId, error: e }, 'Failed to fetch specific schema for data generation');
                entities = await this.cmsClient.getAllXEntity(context.externalCookie);
            }
        } else {
            entities = await this.cmsClient.getAllXEntity(context.externalCookie);
        }

        await context.updateStatus('Generating sample data with AI...');
        const response: DataGeneratorResponse = await this.aiProvider.generate(
            this.systemPrompt,
            `\nSCHEMA DEFINITION:\n${JSON.stringify(entities, null, 2)}`,
            userInput,
            parseModelFromProvider(context.providerName)
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

    async act(plan: DataGeneratorPlan, context: AgentContext): Promise<AgentResponse | null> {
        const { entityName, data, targetEntity } = plan;

        if (!entityName || !Array.isArray(data) || data.length === 0) {
            await context.saveAgentMessage('I could not generate any data. Please make sure the entity exists and your request is clear.');
            return null;
        }

        if (!targetEntity) {
            await context.saveAgentMessage(`I could not find the entity "${entityName}" in the schema definition.`);
            return null;
        }

        await context.saveAgentMessage(`Generated ${data.length} items for "${entityName}". Inserting into CMS...`);
        await context.updateStatus(`Inserting ${data.length} items into "${entityName}"...`);

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

        await context.saveAgentMessage(`Successfully inserted ${successCount} out of ${data.length} items for "${entityName}".`);
        return null;
    }
}