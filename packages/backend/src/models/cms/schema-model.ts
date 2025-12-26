import { type SchemaSummary, type SaveEntityPayload } from '@cms/shared';
import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';

export class SchemaModel {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly externalCookie: string
    ) { }

    async commit(summary: SchemaSummary): Promise<void> {
        if (summary.entities.length === 0) {
            this.logger.info('No entities provided to commit.');
            return;
        }

        for (const item of summary.entities) {
            try {
                const payload: SaveEntityPayload = {
                    schemaId: item.schemaId || null,
                    type: 'entity',
                    settings: {
                        entity: item
                    }
                };

                await this.cmsClient.saveEntity(this.externalCookie, payload);
                this.logger.info({ entityName: item.name }, 'Successfully committed entity');
            } catch (saveError) {
                this.logger.error({ error: saveError, entityName: item.name }, 'Failed to commit entity');
                throw saveError; // Re-throw to handle it in the service if needed
            }
        }

    }
}
