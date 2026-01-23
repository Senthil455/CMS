import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';

import { IntentClassifier } from '../models/agents/intent-classifier';
import { EntityGenerator } from '../models/agents/entity-generator';

import { QueryGenerator } from '../models/agents/query-generator';
import { PageGenerator } from '../models/agents/page-generator';
// removed PageArchitect and RouterDesigner import
import { HtmlGenerator } from '../models/agents/html-generator';
import { DataGenerator } from '../models/agents/data-generator';
// removed HtmlGenerationHandler import

const handlersPlugin: FastifyPluginAsync = async (fastify) => {
    const providers = fastify.aiProvider;
    const cmsClient = fastify.cms;
    const modelLogger = fastify.log.child({ component: 'MODEL' }, { level: config.LOG_LEVEL_MODEL });

    // Resolve directories
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const promptsDir = path.join(__dirname, '../prompts');
    const schemasDir = path.join(__dirname, '../schemas');

    // Load common schemas
    const [entitySchema, attributeSchema, relationshipSchema] = await Promise.all([
        fs.readFile(path.join(schemasDir, 'entity.json'), 'utf-8'),
        fs.readFile(path.join(schemasDir, 'attribute.json'), 'utf-8'),
        fs.readFile(path.join(schemasDir, 'relationship.json'), 'utf-8'),
    ]);

    const intentClassifiers: Record<string, IntentClassifier> = {};

    for (const [providerName, provider] of Object.entries(providers)) {
        const promptSubDir = providerName;
        try {
            const loadPrompt = async (fileName: string) => {
                try {
                    return await fs.readFile(path.join(promptsDir, `${promptSubDir}/${fileName}`), 'utf-8');
                } catch (e) {
                    fastify.log.warn(`Prompt ${fileName} not found for provider ${providerName}, using empty string`);
                    return '';
                }
            };

            const [
                entityGeneratorPrompt,
                intentClassifierPrompt,
                queryGeneratorPrompt,
                dataGeneratorPrompt,
                pageArchitectPrompt,
                routerDesignerPrompt,
                htmlGeneratorPrompt
            ] = await Promise.all([
                fs.readFile(path.join(promptsDir, `${promptSubDir}/entity-generator.txt`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/intent-classifier.txt`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/query-generator.txt`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/data-generator.txt`), 'utf-8'),
                loadPrompt('page-architect.txt'),
                loadPrompt('router-designer.txt'),
                loadPrompt('html-generator.txt'),
            ]);

            const [
                modernListPrompt,
                modernDetailPrompt,
                classicListPrompt,
                classicDetailPrompt,
                minimalListPrompt,
                minimalDetailPrompt
            ] = await Promise.all([
                fs.readFile(path.join(promptsDir, 'styles/modern-editorial-list.txt'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/modern-editorial-detail.txt'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/classic-newspaper-list.txt'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/classic-newspaper-detail.txt'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/minimalist-visual-list.txt'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/minimalist-visual-detail.txt'), 'utf-8'),
            ]);

            const styleMap: Record<string, string> = {
                'modern-list': modernListPrompt,
                'modern-detail': modernDetailPrompt,
                'classic-list': classicListPrompt,
                'classic-detail': classicDetailPrompt,
                'minimal-list': minimalListPrompt,
                'minimal-detail': minimalDetailPrompt,
                // Fallbacks
                'modern': modernListPrompt,
                'classic': classicListPrompt,
                'minimal': minimalListPrompt
            };

            const engagementBarPrompt = await fs.readFile(path.join(promptsDir, 'components/engagement-bar.txt'), 'utf-8').catch(() => '');

            // removed routerDesigner and pageArchitect instantiation
            const htmlGenerator = new HtmlGenerator(provider, htmlGeneratorPrompt, styleMap, engagementBarPrompt, cmsClient, modelLogger);

            const dataDir = path.join(__dirname, '../data');
            const templatesData = await fs.readFile(path.join(dataDir, 'templates.json'), 'utf-8');
            const templates = JSON.parse(templatesData);

            const entityGenerator = new EntityGenerator(provider, entityGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const queryGenerator = new QueryGenerator(provider, queryGeneratorPrompt, cmsClient, modelLogger);
            const pageGenerator = new PageGenerator(provider, pageArchitectPrompt, routerDesignerPrompt, cmsClient, modelLogger, config.CMS_PUBLIC_URL, templates);
            const dataGenerator = new DataGenerator(provider, dataGeneratorPrompt, cmsClient, modelLogger);
            // removed htmlGenerationHandler instantiation

            const intentClassifier = new IntentClassifier(
                provider,
                intentClassifierPrompt
            );

            intentClassifiers[providerName] = intentClassifier;

            // @ts-ignore
            if (!fastify.chatHandlers) {
                fastify.decorate('chatHandlers', {});
            }
            // @ts-ignore
            if (!fastify.chatHandlers[providerName]) {
                // @ts-ignore
                fastify.chatHandlers[providerName] = {};
            }

            // @ts-ignore
            fastify.chatHandlers[providerName] = {
                entity_generator: entityGenerator,
                query_generator: queryGenerator,
                page_generator: pageGenerator,
                data_generator: dataGenerator,
                html_generator: htmlGenerator,
            };
        } catch (error) {
            fastify.log.warn(`Failed to load prompts for provider "${providerName}": ${(error as Error).message}`);
        }
    }

    fastify.decorate('intentClassifier', intentClassifiers);
};

export default fp(handlersPlugin, {
    name: 'intentClassifier',
    dependencies: ['aiProvider', 'cms']
});
