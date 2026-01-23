import type { AIProvider } from '../../infrastructures/agent.interface';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { type Agent, type AgentContext, handleAgentError } from './chat-agent';
import { type EntityDto, type RelationshipDto, AGENT_TRIGGERS } from '@cms/shared';
import { EntityModel } from '../cms/entity-model';
import { RelationshipModel } from '../cms/relationship-model';

export interface EntityGeneratorResponse {
    entities: EntityDto[];
    relationships: RelationshipDto[];
}

export interface EntityGeneratorPlan extends EntityGeneratorResponse {
    existingContext?: string;
    userInput: string;
}

export class EntityGenerator implements Agent<EntityGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly relationshipSchema: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
    ) { }

    async create(userInput: string, existingContext?: string): Promise<EntityGeneratorResponse> {
        let schemasText = [
            { name: 'entity', content: this.entitySchema },
            { name: 'attribute', content: this.attributeSchema },
            { name: 'relationship', content: this.relationshipSchema }
        ].map(s => `${s.name.toUpperCase()} SCHEMA:\n${s.content}`).join('\n\n');

        if (existingContext) {
            schemasText += `\n\n${existingContext}`;
        }

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            schemasText,
            userInput
        );

        return response;
    }

    async think(userInput: string, context: AgentContext): Promise<EntityGeneratorPlan> {
        let existingContext = '';
        const idMatch = userInput.match(new RegExp(`${AGENT_TRIGGERS.ENTITY_GENERATOR}#([^:]+):`));

        if (idMatch) {
            const schemaId = idMatch[1] as string;
            try {
                const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
                if (existingSchema && existingSchema.settings.entity) {
                    const ent = existingSchema.settings.entity;
                    existingContext = `EXISTING ENTITY SCHEMA FOR "${ent.name}" (ID: ${schemaId}):\n${JSON.stringify({
                        name: ent.name,
                        tableName: ent.tableName,
                        attributes: ent.attributes
                    }, null, 2)}`;
                    await context.saveAssistantMessage(`I found the existing entity "${ent.name}". I'll fetch its schema and help you modify it...`);
                }
            } catch (e) {
                this.logger.warn({ schemaId }, 'Existing entity not found for modification');
                await context.saveAssistantMessage(`I couldn't find an existing entity with ID "${schemaId}". I'll proceed with generating what you need...`);
            }
        } else {
            await context.saveAssistantMessage('I am entity generator, I am analyzing your requirements and generating the schema...');
        }

        const resp = await this.create(userInput, existingContext);

        return {
            ...resp,
            existingContext,
            userInput
        };
    }

    async act(plan: EntityGeneratorPlan, context: AgentContext): Promise<void> {
        // Normalize: handle cases where AI might return 'fields' instead of 'attributes'
        const entities = (plan.entities || []).map((e: any) => ({
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

        const normalizedRelationships = (plan.relationships || []).map(r => new RelationshipModel(r).normalize());

        await context.onConfirmSchemaSummary({
            userInput: plan.userInput,
            summary,
            entities: summaryEntities,
            relationships: normalizedRelationships
        });
    }

    async handle(userInput: string, context: AgentContext): Promise<void> {
        try {
            const plan = await this.think(userInput, context);

            // Save AI response to database log
            await context.saveAiResponseLog('entity-generator', JSON.stringify({ ...plan, taskType: context.taskType }));

            await this.act(plan, context);
        } catch (error: any) {
            await handleAgentError(error, context, this.logger, "generating your schema", this.aiProvider);
        }
    }
}
