import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, type ThinkResult, type ActResult, type FinalizeResult } from './chat-assistant';
import { UserVisibleError } from './user-visible-error';

import { AGENT_NAMES } from '@cms/shared';

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

    async think(userInput: string, context: AgentContext): Promise<ThinkResult<DataGeneratorPlan>> {
        await context.saveAgentMessage('Fetching the latest schema and generating your data...');

        let entities: any[] = [];
        let specificEntityName: string | undefined;

        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.DATA_SYNTHESIZER}#([^:]+):`));

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

        const devMsg = `\nSCHEMA DEFINITION:\n${JSON.stringify(entities, null, 2)}`;

        const response: DataGeneratorResponse = await this.aiProvider.generate(
            this.systemPrompt,
            devMsg,
            userInput,
            context.signal ? { signal: context.signal } : undefined
        );

        const { entityName, data } = response;
        let targetEntity: any = undefined;

        if (entityName && Array.isArray(data) && data.length > 0) {
            targetEntity = entities.find(e => e.name === entityName);
        }

        return {
            plan: {
                ...response,
                entities,
                targetEntity
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage: devMsg,
                userInput: userInput
            }
        };
    }

    async act(plan: DataGeneratorPlan, context: AgentContext): Promise<ActResult<DataGeneratorPlan>> {
        const { entityName, data, targetEntity } = plan;

        if (!entityName || !Array.isArray(data) || data.length === 0) {
            await context.saveAgentMessage('I could not generate any data. Please make sure the entity exists and your request is clear.');
            return { feedback: null, syncedSchemaIds: [] };
        }

        if (!targetEntity) {
            await context.saveAgentMessage(`I could not find the entity "${entityName}" in the schema definition.`);
            return { feedback: null, syncedSchemaIds: [] };
        }

        await context.saveAgentMessage(`Generated ${data.length} items for "${entityName}". Inserting into the system...`);

        let successCount = 0;
        const idMaps: Record<string, Record<string, any>> = {};
        for (const item of data) {
            try {
                await this.cmsClient.insertData(context.externalCookie, targetEntity, item, idMaps);
                successCount++;
            } catch (e) {
                this.logger.error({ error: e, item }, 'Failed to insert item');
                throw new UserVisibleError(`Failed to insert synthetic data: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
        }

        await context.saveAgentMessage(`Successfully inserted ${successCount} out of ${data.length} items for "${entityName}".`);
        return { feedback: null, syncedSchemaIds: [] };
    }

    async finalize(_feedbackData: any, _context: AgentContext): Promise<FinalizeResult> {
        return { syncedSchemaIds: [] };
    }
}