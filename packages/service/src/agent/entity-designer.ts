import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, BaseAgent, parseModelFromProvider } from './chat-assistant';
import { type EntityDto, type RelationshipDto, AGENT_NAMES } from '@cms/shared';
import { EntityModel } from '../models/entity-model';
import { RelationshipModel } from '../models/relationship-model';
import { EntityOperator } from '../operators/entity-operator';

export interface EntityGeneratorResponse {
    entities: EntityDto[];
    relationships: RelationshipDto[];
}

export interface EntityGeneratorPlan extends EntityGeneratorResponse {
    existingContext?: string;
    userInput: string;
}

export class EntityGenerator extends BaseAgent<EntityGeneratorPlan> {
    constructor(
        aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly relationshipSchema: string,
        private readonly cmsClient: CmsClient,
        logger: ServiceLogger,
        private readonly entityOperator: EntityOperator,
    ) {
        super("generating your schema", logger, aiProvider);
    }

    async create(userInput: string, existingContext?: string, context?: AgentContext): Promise<EntityGeneratorResponse> {
        let schemasText = [
            { name: 'entity', content: this.entitySchema },
            { name: 'attribute', content: this.attributeSchema },
            { name: 'relationship', content: this.relationshipSchema }
        ].map(s => `${s.name.toUpperCase()} SCHEMA:\n${s.content}`).join('\n\n');

        if (existingContext) {
            schemasText += `\n\n${existingContext}`;
        }

        this.setLastPrompts(this.systemPrompt, schemasText, userInput);

        const response = await this.aiProvider.generate(
            this.systemPrompt,
            schemasText,
            userInput,
            parseModelFromProvider(context?.providerName || '')
        );

        return response;
    }

    async think(userInput: string, context: AgentContext): Promise<EntityGeneratorPlan> {
        let existingContext = '';
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.ENTITY_DESIGNER}#([^:]+):`));

        if (idMatch) {
            const schemaId = idMatch[1] as string;
            await context.updateStatus(`Fetching schema for entity ID: ${schemaId}...`);
            try {
                const existingSchema = await this.cmsClient.getSchemaBySchemaId(context.externalCookie, schemaId);
                if (existingSchema && existingSchema.settings.entity) {
                    const ent = existingSchema.settings.entity;
                    existingContext = `EXISTING ENTITY SCHEMA FOR "${ent.name}" (ID: ${schemaId}):\n${JSON.stringify({
                        name: ent.name,
                        tableName: ent.tableName,
                        attributes: ent.attributes
                    }, null, 2)}`;
                    await context.saveAgentMessage(`I found the existing entity "${ent.name}". I'll fetch its schema and help you modify it...`);
                }
            } catch (e) {
                this.logger.warn({ schemaId }, 'Existing entity not found for modification');
                await context.saveAgentMessage(`I couldn't find an existing entity with ID "${schemaId}". I'll proceed with generating what you need...`);
            }
        } else {
            await context.saveAgentMessage('I am entity generator, I am analyzing your requirements and generating the schema...');
        }

        await context.updateStatus('Analyzing requirements and generating schema...');
        const resp = await this.create(userInput, existingContext, context);

        return {
            ...resp,
            existingContext,
            userInput
        };
    }

    async act(plan: EntityGeneratorPlan, context: AgentContext): Promise<boolean> {
        // Normalize: handle cases where AI might return 'fields' instead of 'attributes'
        const entities = (plan.entities || []).map((e: any) => ({
            ...e,
            attributes: e.attributes || e.fields || []
        }));

        // normalize attributes using model behavior
        const normalizedEntities = entities.map((entity: any) => new EntityModel(entity).normalize());
        const normalizedRelationships = (plan.relationships || []).map(r => new RelationshipModel(r).normalize());

        // Compare with CMS to categorize entities and create summary
        await context.updateStatus('Comparing with existing schemas and preparing summary...');
        const summary = await this.entityOperator.prepareSummary(
            normalizedEntities,
            normalizedRelationships,
            plan.userInput,
            context.externalCookie
        );

        this.logger.info({ summary }, 'Summary prepared by EntityOperator');

        await context.onConfirmSchemaSummary(summary);
        return true;
    }
}
