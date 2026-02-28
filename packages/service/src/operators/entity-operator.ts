import {
    type SchemaSummary,
    type SchemaDto,
    type SaveSchemaPayload,
    type EntityDto,
    type RelationshipDto
} from '@cms/shared';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import { RelationshipModel } from '../models/relationship-model';

export class EntityOperator {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger
    ) { }

    async prepareSummary(
        normalizedEntities: EntityDto[],
        relationships: RelationshipDto[],
        userInput: string,
        externalCookie: string
    ): Promise<SchemaSummary> {
        this.logger.info('Comparing with existing schemas and preparing summary in EntityOperator...');
        const existingSchemas = await this.cmsClient.getAllEntities(externalCookie);

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

        const summarySummaryText = `Proposed Schema Changes:\n${summaryText}`;

        return {
            taskId: undefined,
            userInput: userInput,
            summary: summarySummaryText,
            entities: summaryEntities,
            relationships: relationships
        };
    }

    async commit(summary: SchemaSummary, externalCookie: string): Promise<string[]> {
        const schemaIds = new Set<string>();

        // 1. Commit regular entities
        if (summary.entities.length > 0) {
            for (const item of summary.entities) {
                const payload: SaveSchemaPayload = {
                    schemaId: item.schemaId || null,
                    type: 'entity',
                    description: summary.userInput,
                    settings: {
                        entity: item
                    }
                };

                try {
                    const resp = await this.cmsClient.saveEntityDefine(externalCookie, payload);
                    if (resp.data?.schemaId) {
                        schemaIds.add(resp.data.schemaId);
                    }
                    this.logger.info({ entityName: item.name }, 'Successfully committed entity via EntityOperator');
                } catch (saveError: any) {
                    this.logger.error({ error: saveError, entityName: item.name, payload }, 'Failed to commit entity');
                    throw saveError;
                }
            }
        }

        // 2. Commit relationships
        if (summary.relationships && summary.relationships.length > 0) {
            const resls = summary.relationships.map(rel => new RelationshipModel(rel).normalize());
            this.logger.info('Processing relationships in EntityOperator...');
            const allEntities = await this.cmsClient.getAllEntities(externalCookie);

            const modifiedIds1 = await this.applyAndSave(resls, allEntities, (model, entities) => model.applyLookupAndJunctionToEntities(entities), externalCookie);
            modifiedIds1.forEach(id => schemaIds.add(id));

            const modifiedIds2 = await this.applyAndSave(resls, allEntities, (model, entities) => model.applyCollectionToEntities(entities), externalCookie);
            modifiedIds2.forEach(id => schemaIds.add(id));
        }

        return Array.from(schemaIds);
    }

    private async applyAndSave(
        relationships: any[],
        allEntities: SchemaDto[],
        applyFn: (relModel: RelationshipModel, allEntities: SchemaDto[]) => SchemaDto[],
        externalCookie: string
    ): Promise<string[]> {
        const modifiedEntitiesMap = new Map<string, SchemaDto>();

        for (const rel of relationships) {
            try {
                const relModel = new RelationshipModel(rel);
                const changed = applyFn(relModel, allEntities);
                for (const entity of changed) {
                    modifiedEntitiesMap.set(entity.schemaId!, entity);
                }
            } catch (error) {
                this.logger.error({ error, relationship: rel }, 'Failed to apply relationship to entities');
            }
        }

        for (const entity of modifiedEntitiesMap.values()) {
            const payload: SaveSchemaPayload = {
                schemaId: entity.schemaId!,
                type: 'entity',
                settings: {
                    entity: entity.settings.entity!
                }
            };
            try {
                await this.cmsClient.saveEntityDefine(externalCookie, payload);
                this.logger.info({ entityName: entity.name }, 'Successfully updated entity for relationship');
            } catch (saveError) {
                this.logger.error({ error: saveError, entityName: entity.name, payload }, 'Failed to update entity for relationship');
            }
        }

        return Array.from(modifiedEntitiesMap.keys());
    }
}
