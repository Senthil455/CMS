import type { CmsClient } from '../../infrastructures/cms-client';
import type { ServiceLogger } from '../../types/logger';
import type { SaveSchemaPayload, TemplateSelectionResponse, PagePlan } from '@cms/shared';
import { LayoutCompiler, HTML_BLOCKS, type LayoutJson } from '@cms/shared';

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
                    metadata: updatedMetadata,
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

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
            metadata = pageSettings.metadata ? pageSettings.metadata : {};
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
                    metadata: metadata,
                }
            }
        };

        await this.cmsClient.saveSchema(this.externalCookie, payload);
        this.logger.info({ schemaId }, 'Successfully saved architecture via PageManager');
    }

    async saveLayout(schemaId: string, layoutJson: any, title?: string): Promise<string> {
        const schema = await this.cmsClient.getSchemaBySchemaId(this.externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = {};
        try {
            metadata = pageSettings.metadata ? pageSettings.metadata : {};
        } catch (e) {
            this.logger.warn({ schemaId, error: e }, 'Failed to parse page metadata');
        }

        metadata.layoutJson = layoutJson;

        let compiledHtml = pageSettings.html;
        try {
            const layout = layoutJson as LayoutJson;
            const componentsMap: Record<string, { html: string; props?: any }> = {};
            if (layout && layout.sections) {
                layout.sections.forEach(section => {
                    section.columns.forEach(col => {
                        col.blocks.forEach(block => {
                            const template = HTML_BLOCKS[block.type] || '';
                            componentsMap[block.id] = { html: template, props: {} };
                        });
                    });
                });
                compiledHtml = LayoutCompiler.compile(layout, componentsMap, title || pageSettings.title);
            }
        } catch (e) {
            this.logger.warn({ schemaId, error: e }, 'Failed to compile HTML from AI layout components');
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

        const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved page layout JSON via PageManager');
        return newSchemaId;
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
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved page HTML via PageManager');
        return newSchemaId;
    }

    async saveComponentInstructions(schemaId: string, componentInstructions: any[]): Promise<void> {
        const schema = await this.cmsClient.getSchemaBySchemaId(this.externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = {};
        try {
            metadata = pageSettings.metadata ? pageSettings.metadata : {};
        } catch (e) {
            this.logger.warn({ schemaId, error: e }, 'Failed to parse page metadata');
        }

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

        await this.cmsClient.saveSchema(this.externalCookie, payload);
        this.logger.info({ schemaId }, 'Successfully saved component instructions via PageManager');
    }

    async saveComponents(
        schemaId: string,
        layoutJson: LayoutJson,
        components: Record<string, { html: string; props?: any }>,
        title?: string
    ): Promise<string> {
        const schema = await this.cmsClient.getSchemaBySchemaId(this.externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new Error(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: any = {};
        try {
            metadata = pageSettings.metadata ? pageSettings.metadata : {};
        } catch (e) {
            this.logger.warn({ schemaId, error: e }, 'Failed to parse page metadata');
        }

        metadata.layoutJson = layoutJson;
        metadata.components = components;

        // Compile final HTML from layout + components
        let compiledHtml = pageSettings.html;
        try {
            compiledHtml = LayoutCompiler.compile(layoutJson, components, title || pageSettings.title);
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

        const saveResp = await this.cmsClient.saveSchema(this.externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved AI-generated components and compiled HTML via PageManager');
        return newSchemaId;
    }
}

