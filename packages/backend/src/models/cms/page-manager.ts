import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import type { SaveSchemaPayload, TemplateSelectionResponse, RoutingPlan } from '@cms/shared';

export class PageManager {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly externalCookie: string
    ) { }

    public static parseMetadata(metadataJson: string | undefined): any {
        try {
            return metadataJson ? JSON.parse(metadataJson) : {};
        } catch (e) {
            return {};
        }
    }

    async savePage(plan: RoutingPlan & TemplateSelectionResponse & { schemaId?: string }, existingHtml?: string, existingTitle?: string, existingMetadata?: any): Promise<string> {
        let name = plan.pageName || `generated-page-${Date.now()}`;

        const payload: SaveSchemaPayload = {
            schemaId: plan.schemaId || null,
            type: 'page',
            settings: {
                page: {
                    name: name,
                    title: existingTitle || name,
                    html: existingHtml || '',
                    source: 'ai',
                    metadata: JSON.stringify({
                        ...(existingMetadata || {}),
                        routingPlan: plan,
                    }),
                }
            }
        };

        try {
            const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
            const newSchemaId = saveResp.data.schemaId;
            this.logger.info({ schemaId: newSchemaId }, 'Successfully saved page via PageManager');
            return newSchemaId;
        } catch (error) {
            this.logger.error({ error, payload }, 'Failed to save page via PageManager');
            throw error;
        }
    }

    async savePageHtml(schemaId: string, html: string, title?: string): Promise<string> {
        const schema = await this.cmsClient.getSchemaBySchemaId(this.externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageSettings,
                    title: title || pageSettings.title,
                    html: html,
                    source: 'ai'
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
        const newSchemaId = saveResp.data.schemaId;
        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved page HTML via PageManager');
        return newSchemaId;
    }

    async savePageTypeAndTemplate(schemaId: string | null | undefined, pageType: string, templateId: string, userInput: string): Promise<string> {
        let pageSettings: any = {
            name: `generated-page-${Date.now()}`,
            title: `Generated Page ${Date.now()}`,
            html: '',
            source: 'ai',
            metadata: '{}'
        };
        let metadata = {};

        if (schemaId) {
            const schema = await this.cmsClient.getSchemaBySchemaId(this.externalCookie, schemaId);
            if (schema && schema.settings.page) {
                pageSettings = schema.settings.page;
                try {
                    metadata = pageSettings.metadata ? JSON.parse(pageSettings.metadata) : {};
                } catch (e) {
                    this.logger.warn({ schemaId, error: e }, 'Failed to parse page metadata');
                }
            } else {
                throw new Error(`Page with schemaId ${schemaId} not found`);
            }
        }

        const updatedMetadata = {
            ...metadata,
            pageType,
            templateId,
            userInput
        };

        const payload: SaveSchemaPayload = {
            schemaId: schemaId || null,
            type: 'page',
            settings: {
                page: {
                    name: pageSettings.name,
                    title: pageSettings.title,
                    html: pageSettings.html,
                    source: pageSettings.source,
                    metadata: JSON.stringify(updatedMetadata),
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
        const newSchemaId = saveResp.data.schemaId;
        this.logger.info({ schemaId: newSchemaId, pageType, templateId }, 'Updated page type and template');
        return newSchemaId;
    }

    async saveRoutingPlan(schemaId: string, plan: object): Promise<void> {
        const schema = await this.cmsClient.getSchemaBySchemaId(this.externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = {};
        try {
            metadata = pageSettings.metadata ? JSON.parse(pageSettings.metadata) : {};
        } catch (e) {
            this.logger.warn({ schemaId, error: e }, 'Failed to parse page metadata');
        }

        metadata.routingPlan = plan;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    name: pageSettings.name,
                    title: pageSettings.title,
                    html: pageSettings.html,
                    source: pageSettings.source,
                    metadata: JSON.stringify(metadata),
                }
            }
        };

        await this.cmsClient.saveSchema(this.externalCookie, payload);
    }
}
