import { type SchemaSummary, type SaveEntityPayload, type SchemaDto } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import { RelationshipModel } from './relationship-model';

export class SchemaManager {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly externalCookie: string
    ) { }

    async commit(summary: SchemaSummary): Promise<void> {
        // 1. Commit regular entities
        if (summary.entities.length > 0) {
            for (const item of summary.entities) {
                const payload: SaveEntityPayload = {
                    schemaId: item.schemaId || null,
                    type: 'entity',
                    settings: {
                        entity: item
                    }
                };

                try {
                    await this.cmsClient.saveEntity(this.externalCookie, payload);
                    this.logger.info({ entityName: item.name }, 'Successfully committed entity');
                } catch (saveError: any) {
                    this.logger.error({ error: saveError, entityName: item.name, payload }, 'Failed to commit entity');
                    throw saveError;
                }
            }
        }

        // 2. Commit relationships
        if (summary.relationships && summary.relationships.length > 0) {
            const resls = summary.relationships.map(rel => new RelationshipModel(rel).normalize());
            this.logger.info('Processing relationships...');
            const allEntities = await this.cmsClient.getAllEntities(this.externalCookie);

            await this.applyAndSave(resls, allEntities, (model, entities) => model.applyLookupAndJunctionToEntities(entities));
            await this.applyAndSave(resls, allEntities, (model, entities) => model.applyCollectionToEntities(entities));
        }
    }

    private async applyAndSave(
        relationships: any[],
        allEntities: SchemaDto[],
        applyFn: (relModel: RelationshipModel, allEntities: SchemaDto[]) => SchemaDto[]
    ) {
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
            const payload: SaveEntityPayload = {
                schemaId: entity.schemaId!,
                type: 'entity',
                settings: entity.settings
            };
            try {
                await this.cmsClient.saveEntity(this.externalCookie, payload);
                this.logger.info({ entityName: entity.name }, 'Successfully updated entity for relationship');
            } catch (saveError) {
                this.logger.error({ error: saveError, entityName: entity.name, payload }, 'Failed to update entity for relationship');
            }
        }
    }
}
