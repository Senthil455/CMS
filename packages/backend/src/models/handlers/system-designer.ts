import type { AIAgent } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type ChatHandler, type ChatContext } from './chat-handler';
import { type EntityDto, type SaveEntityPayload, type SchemaDto } from '@cms/shared';
import { EntityModel } from '../cms/entity-model';

export interface SystemDesignerResponse {
    entities: EntityDto[];
    relationships: any[];
}

export class SystemDesigner implements ChatHandler {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly relationshipSchema: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async create(userInput: string): Promise<SystemDesignerResponse> {
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

    async handle(userInput: string, _entityName: string, context: ChatContext): Promise<void> {
        try {
            await context.saveAssistantMessage('I am system designer, I am analyzing your requirements...');

            const resp = await this.create(userInput);

            // Save AI response to database log
            await context.saveAiResponseLog('system-designer', JSON.stringify(resp));


            // Normalize: handle cases where AI might return 'fields' instead of 'attributes'
            const entities = (resp.entities || []).map((e: any) => ({
                ...e,
                attributes: e.attributes || e.fields || []
            }));

            // normalize attributes using model behavior
            const normalizedEntities = entities.map((entity: any) => new EntityModel(entity).normalize());

            // Compare with CMS to categorize entities
            const existingSchemas = await this.cmsClient.getAllEntities(context.externalCookie);

            const proposedEntities = normalizedEntities.map(ne => {
                const existing = existingSchemas.find(es => es.name === ne.name);
                return {
                    entity: ne,
                    status: existing ? 'overwrite' : 'new' as 'new' | 'overwrite',
                    schemaId: existing?.schemaId || null
                };
            });

            const summary = proposedEntities.map(pe => `- ${pe.entity.name} (${pe.status}${pe.status === 'overwrite' ? ` - existing sid: ${pe.schemaId}` : ''})`).join('\n');

            // Emit structured event for UI confirmation
            const summaryEntities = proposedEntities.map(pe => ({
                ...pe.entity,
                op: (pe.status === 'new' ? 'add' : 'update') as 'add' | 'update',
                schemaId: pe.schemaId
            }));
            this.logger.info({ summaryEntities }, 'Summary entities');

            await context.onConfirmSchemaSummary({
                summary,
                entities: summaryEntities

            });

            await context.saveAssistantMessage(
                "I have analyzed your requirements. Please confirm the proposed schema changes in the UI."
            );
        } catch (error: any) {
            this.logger.error({ error, stack: error?.stack }, 'Error in SystemDesigner handle');
            await context.saveAssistantMessage("I'm sorry, I encountered an error while generating your entities.");
        }
    }
}
