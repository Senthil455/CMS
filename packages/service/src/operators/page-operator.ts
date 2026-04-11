import {
    type SaveSchemaPayload,
    LayoutCompiler,
    type PageMetadata,
    type PageComponent,
    type PagePlanResponse,
    type PageArchitecture
} from '@cms/shared';
import type { CmsClient } from '../infrastructures/cms-client';
import type { ServiceLogger } from '../types/logger';
import type { ISystemSettingRepository } from '../repositories/system-setting-repository';
import { UserVisibleError } from '../agent/user-visible-error';

export class PageOperator {
    constructor(
        private readonly cmsClient: CmsClient,
        private readonly logger: ServiceLogger,
        private readonly systemSettingRepository?: ISystemSettingRepository
    ) { }

    async savePlanAndUserInput(
        plan: PagePlanResponse,
        templateId: string,
        userInput: string,
        externalCookie: string
    ): Promise<string> {
        const metadata: PageMetadata = {
            templateId,
            userInput,
        };

        const payload: SaveSchemaPayload = {
            schemaId: null,
            type: 'page',
            settings: {
                page: {
                    name: plan.pageName,
                    title: plan.pageTitle,
                    entityName: plan.entityName,
                    pageType: plan.pageType,
                    html: '',
                    metadata,
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved plan and user input via PageOperator');
        return newSchemaId;
    }

    async saveArchitecture(schemaId: string, architecture: PageArchitecture, externalCookie: string): Promise<void> {
        const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new UserVisibleError(`Page with schemaId ${schemaId} not found`);
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
                    metadata: metadata,
                }
            }
        };

        await this.cmsClient.saveSchema(externalCookie, payload);
        this.logger.info({ schemaId }, 'Successfully saved architecture via PageOperator');
    }

    async saveComponents(
        schemaId: string,
        component: PageComponent,
        externalCookie: string
    ): Promise<string> {
        const schema = await this.cmsClient.getSchemaBySchemaId(externalCookie, schemaId);
        if (!schema || !schema.settings.page) {
            throw new UserVisibleError(`Page with schemaId ${schemaId} not found`);
        }

        const pageSettings = schema.settings.page;
        let metadata: PageMetadata = pageSettings.metadata || {};

        const components = metadata.components || [];
        const existingIdx = components.findIndex(c => c.id === component.id);
        if (existingIdx > -1) {
            components[existingIdx] = component;
        } else {
            components.push(component);
        }
        metadata.components = components;

        // Compile final HTML from layout + components
        let compiledHtml = pageSettings.html;
        try {
            const compileOptions: any = { enableVisitTrack: metadata.enableVisitTrack ?? false };
            if (metadata.customHeader) {
                compileOptions.customHeader = metadata.customHeader;
            }
            if (this.systemSettingRepository) {
                const gaEnabled = await this.systemSettingRepository.get('ENABLE_GOOGLE_ANALYTICS');
                const gaMeasurementId = await this.systemSettingRepository.get('GA_MEASUREMENT_ID');
                if (gaEnabled === 'true' && gaMeasurementId) {
                    compileOptions.enableGoogleAnalytics = true;
                    compileOptions.googleAnalyticsMeasurementId = gaMeasurementId;
                }
            }
            compiledHtml = LayoutCompiler.compile(metadata.architecture?.sections || [], components, pageSettings.title, compileOptions);
        } catch (e) {
            throw new UserVisibleError("Failed to compile HTML layout from the generated components.");
        }

        const payload: SaveSchemaPayload = {
            schemaId: schemaId,
            type: 'page',
            settings: {
                page: {
                    ...pageSettings,
                    html: compiledHtml,
                    metadata: metadata,
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
            throw new UserVisibleError(`Page with schemaId ${schemaId} not found`);
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
                }
            }
        };

        const saveResp = await this.cmsClient.saveSchema(externalCookie, payload);
        const newSchemaId = saveResp.schemaId;

        this.logger.info({ schemaId: newSchemaId }, 'Successfully saved page HTML via PageOperator');
        return newSchemaId;
    }

}
