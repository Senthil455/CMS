import type { AIProvider } from '../infrastructures/ai-provider.interface';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { type AgentContext, type Agent, type AgentPlanResponse, type AgentActResult, type AgentFinalizeResult } from './chat-assistant';
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

export class EntityGenerator implements Agent<EntityGeneratorPlan> {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
        private readonly entitySchema: string,
        private readonly attributeSchema: string,
        private readonly relationshipSchema: string,
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly entityOperator: EntityOperator,
    ) { }

    async create(userInput: string, existingContext?: string, context?: AgentContext): Promise<{ response: EntityGeneratorResponse, developerMessage: string }> {
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
            userInput,
            context?.selection.model,
            context?.signal ? { signal: context.signal } : undefined
        );

        let responseJson: any;
        if (typeof response === 'string') {
            responseJson = JSON.parse(response);
        } else {
            responseJson = response;
        }
        return { response: responseJson, developerMessage: schemasText };
    }

    async think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<EntityGeneratorPlan>> {
        let existingContext = '';
        const idMatch = userInput.match(new RegExp(`${AGENT_NAMES.ENTITY_DESIGNER}#([^:]+):`));

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
                    await context.saveAgentMessage(`I found the existing entity "${ent.name}". I'll fetch its schema and help you modify it...`);
                }
            } catch (e) {
                this.logger.warn({ schemaId }, 'Existing entity not found for modification');
                await context.saveAgentMessage(`I couldn't find an existing entity with ID "${schemaId}". I'll proceed with generating what you need...`);
            }
        } else {
            await context.saveAgentMessage('I am entity generator, I am analyzing your requirements and generating the schema...');
        }

        const { response: resp, developerMessage } = await this.create(userInput, existingContext, context);

        return {
            plan: {
                ...resp,
                existingContext,
                userInput
            },
            prompts: {
                systemPrompt: this.systemPrompt,
                developerMessage,
                userInput
            }
        };
    }

    async act(plan: EntityGeneratorPlan, context: AgentContext): Promise<AgentActResult<EntityGeneratorPlan>> {
        // Normalize: handle cases where AI might return 'fields' instead of 'attributes'
        const entities = (plan.entities || []).map((e: any) => ({
            ...e,
            attributes: e.attributes || e.fields || []
        }));

        // normalize attributes using model behavior
        const normalizedEntities = entities.map((entity: any) => new EntityModel(entity).normalize());
        const normalizedRelationships = (plan.relationships || []).map(r => new RelationshipModel(r).normalize());

        // Compare with CMS to categorize entities and create summary
        const summary = await this.entityOperator.prepareSummary(
            normalizedEntities,
            normalizedRelationships,
            plan.userInput,
            context.externalCookie
        );
        summary.agentTaskItem = context.agentTaskItem;

        this.logger.info({ summary }, 'Summary prepared by EntityOperator');

        // Return summary as feedback data — ChatService will compose the payload and emit the event
        return { feedback: summary, syncedSchemaIds: [] };
    }

    async finalize(feedbackData: any, context: AgentContext): Promise<AgentFinalizeResult> {
        const response = feedbackData;
        if (!response.entities || response.entities.length === 0) {
            await context.saveAgentMessage('No entities provided to commit.');
            return { syncedSchemaIds: [] };
        }

        await context.saveAgentMessage(`Committing ${response.entities.length} entities to CMS...`);
        const schemaIds = await this.entityOperator.commit(response, context.externalCookie);
        await context.saveAgentMessage('All confirmed entities have been successfully committed to CMS.');
        return { syncedSchemaIds: schemaIds };
    }
}
