import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';
import { type EntityDto, type RelationshipDto } from '@cms/shared';
import { EntityModel } from '../cms/entity-model';
import { RelationshipModel } from '../cms/relationship-model';

export interface SchemaGeneratorResponse {
    entities: EntityDto[];
    relationships: RelationshipDto[];
}

export class SchemaGenerator implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly relationshipSchema: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async create(userInput: string): Promise<SchemaGeneratorResponse> {
        const schemasText = [
            { name: 'entity', content: this.entitySchema },
            { name: 'attribute', content: this.attributeSchema },
            { name: 'relationship', content: this.relationshipSchema }
        ].map(s => `${s.name.toUpperCase()} SCHEMA:\n${s.content}`).join('\n\n');

        const response = await this.aiAgent.generate(
            this.systemPrompt,
            schemasText,
            userInput
        );

        return response;
    }

    async handle(userInput: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am schema generator, I am analyzing your requirements...');

            const resp = await this.create(userInput);

            // Save AI response to database log
            await context.saveAiResponseLog('schema-generator', JSON.stringify({ ...resp, taskType: context.taskType }));


            // Normalize: handle cases where AI might return 'fields' instead of 'attributes'
            const entities = (resp.entities || []).map((e: any) => ({
                ...e,
                attributes: e.attributes || e.fields || []
            }));

            // normalize attributes using model behavior
            const normalizedEntities = entities.map((entity: any) => new EntityModel(entity).normalize());

            // Compare with CMS to categorize entities and create summary
            const existingSchemas = await this.cmsClient.getAllEntities(context.externalCookie);

            const summaryEntities = normalizedEntities.map(ne => {
                const existing = existingSchemas.find(es => es.name === ne.name);
                return {
                    ...ne,
                    schemaId: existing?.schemaId || null
                };
            });

            const summaryText = summaryEntities.map(se =>
                `- ${se.name} (${se.schemaId ? 'update' : 'new'}${se.schemaId ? ` - existing sid: ${se.schemaId}` : ''})`
            ).join('\n');

            const summary = `Proposed Schema Changes:\n${summaryText}`;

            this.logger.info({ summaryEntities }, 'Summary entities');

            const normalizedRelationships = (resp.relationships || []).map(r => new RelationshipModel(r).normalize());

            await context.onConfirmSchemaSummary({
                summary,
                entities: summaryEntities,
                relationships: normalizedRelationships
            });

        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in SchemaGenerator handle');
            await context.saveAssistantMessage("I'm sorry, I encountered an error while generating your entities.");
        }
    }
}
