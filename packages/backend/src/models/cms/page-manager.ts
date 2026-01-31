import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import type { SaveSchemaPayload, TemplateSelectionResponse, PagePlan } from '@cms/shared';

export class PageManager {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly externalCookie: string
    ) { }

    async savePlanAndUserInput(
        schemaId: string | null | undefined,
        plan: PagePlan,
        templateId: string,
        userInput: string,
    ): Promise<string> {
        let pageSettings: any = {
            name: plan.pageName || `generated-page-${Date.now()}`,
            title: `Generated Page ${Date.now()}`,
            html: '',
            source: 'ai',
            metadata: '{}'
        };
        let metadata: any = {};

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
            plan,
            templateId,
            userInput,
        };

        const payload: SaveSchemaPayload = {
            schemaId: schemaId || null,
            type: 'page',
            settings: {
                page: {
                    name: plan.pageName || pageSettings.name,
                    title: pageSettings.title,
                    html: pageSettings.html,
                    source: pageSettings.source,
                    metadata: JSON.stringify(updatedMetadata),
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
        const newSchemaId = saveResp.data.schemaId;
        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved plan and user input via PageManager');
        return newSchemaId;
    }

    async saveArchitecture(schemaId: string, architecture: any): Promise<void> {
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

        metadata.architecture = architecture;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageSettings,
                    title: architecture.pageTitle || pageSettings.title,
                    metadata: JSON.stringify(metadata),
                }
            }
        };

        await this.cmsClient.saveSchema(this.externalCookie, payload);
        this.logger.info({ schemaId }, 'Successfully saved architecture via PageManager');
    }

    async saveHtml(schemaId: string, html: string, title?: string): Promise<string> {
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
}
