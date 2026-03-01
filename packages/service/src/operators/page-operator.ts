import {
    type SaveSchemaPayload,
    type LayoutJson,
    LayoutCompiler
} from '@cms/shared';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';

export class PageOperator {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger
    ) { }

    async savePlanAndUserInput(
        schemaId: string | null | undefined,
        plan: any,
        templateId: string,
        userInput: string,
        externalCookie: string
    ): Promise<string> {
        let pageSettings: any = {
            name: plan.pageName,
            title: `Generated Page ${Date.now()}`,
            html: '',
            source: 'ai',
            metadata: '{}'
        };
        let metadata: any = {};

        if (schemaId) {
            const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
            if (schema && schema.settings.page) {
                pageSettings = schema.settings.page;
                try {
                    metadata = pageSettings.metadata ? (typeof pageSettings.metadata === 'string' ? JSON.parse(pageSettings.metadata) : pageSettings.metadata) : {};
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
                    metadata: updatedMetadata,
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved plan and user input via PageOperator');
        return newSchemaId;
    }

    async saveArchitecture(schemaId: string, architecture: any, externalCookie: string): Promise<void> {
        const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = pageSettings.metadata || {};

        metadata.architecture = architecture;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageSettings,
                    title: architecture.pageTitle || pageSettings.title,
                    metadata: metadata,
                }
            }
        };

        await this.cmsClient.saveSchema(externalCookie, payload);
        this.logger.info({ schemaId }, 'Successfully saved architecture via PageOperator');
    }

    async saveComponents(
        schemaId: string,
        layoutJson: LayoutJson,
        components: Record<string, { html: string; props?: any }>,
        title: string | undefined,
        externalCookie: string
    ): Promise<string> {
        const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = pageSettings.metadata || {};

        metadata.layoutJson = layoutJson;
        metadata.components = components;

        // Compile final HTML from layout + components
        let compiledHtml = pageSettings.html;
        try {
            compiledHtml = LayoutCompiler.compile(layoutJson, components, title || pageSettings.title, { enableVisitTrack: metadata.enableVisitTrack });
        } catch (e) {
            this.logger.warn({ schemaId, error: e }, 'Failed to compile HTML from AI-generated components');
        }

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageSettings,
                    title: title || pageSettings.title,
                    html: compiledHtml,
                    metadata: metadata,
                    source: 'ai'
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved AI-generated components and compiled HTML via PageOperator');
        return newSchemaId;
    }

    async saveHtml(schemaId: string, html: string, title: string | undefined, externalCookie: string): Promise<string> {
        const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
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

        const saveResp = await this.cmsClient.saveSchema(externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved page HTML via PageOperator');
        return newSchemaId;
    }

    async saveComponentInstructions(schemaId: string, componentInstructions: any[], externalCookie: string): Promise<void> {
        const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = pageSettings.metadata || {};

        metadata.componentInstructions = componentInstructions;

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageSettings,
                    metadata: metadata,
                }
            }
        };

        await this.cmsClient.saveSchema(externalCookie, payload);
        this.logger.info({ schemaId }, 'Successfully saved component instructions via PageOperator');
    }
}
