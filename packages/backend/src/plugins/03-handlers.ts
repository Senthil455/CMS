import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';

import { IntentClassifier } from '../models/handlers/intent-classifier';
import { EntityGenerator } from '../models/handlers/entity-generator';

import { QueryGenerator } from '../models/handlers/query-generator';
import { PageGenerator } from '../models/handlers/page-generator';
import { PageArchitect } from '../models/handlers/page-architect';
import { RouterDesigner } from '../models/handlers/router-designer';
import { HtmlGenerator } from '../models/handlers/html-generator';
import { DataGenerator } from '../models/handlers/data-generator';

const handlersPlugin: FastifyPluginAsync = async (fastify) => {
    const agents = fastify.aiAgent;
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

    for (const [agentName, agent] of Object.entries(agents)) {
        const promptSubDir = agentName;
        try {
            const loadPrompt = async (fileName: string) => {
                try {
                    return await fs.readFile(path.join(promptsDir, `${promptSubDir}/${fileName}`), 'utf-8');
                } catch (e) {
                    fastify.log.warn(`Prompt ${fileName} not found for agent ${agentName}, using empty string`);
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

            const routerDesigner = new RouterDesigner(agent, routerDesignerPrompt);
            const pageArchitect = new PageArchitect(agent, pageArchitectPrompt);
            const htmlGenerator = new HtmlGenerator(agent, htmlGeneratorPrompt, styleMap, engagementBarPrompt);

            const entityGenerator = new EntityGenerator(agent, entityGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const queryGenerator = new QueryGenerator(agent, queryGeneratorPrompt, cmsClient, modelLogger);
            const pageGenerator = new PageGenerator(cmsClient, modelLogger, config.CMS_PUBLIC_URL, pageArchitect, routerDesigner, htmlGenerator);
            const dataGenerator = new DataGenerator(agent, dataGeneratorPrompt, cmsClient, modelLogger);

            const intentClassifier = new IntentClassifier(
                agent,
                intentClassifierPrompt
            );

            intentClassifiers[agentName] = intentClassifier;

            // @ts-ignore
            if (!fastify.chatHandlers) {
                fastify.decorate('chatHandlers', {});
            }
            // @ts-ignore
            if (!fastify.chatHandlers[agentName]) {
                // @ts-ignore
                fastify.chatHandlers[agentName] = {};
            }

            // @ts-ignore
            fastify.chatHandlers[agentName] = {
                entity_generator: entityGenerator,
                query_generator: queryGenerator,
                page_generator: pageGenerator,
                data_generator: dataGenerator,
            };
        } catch (error) {
            fastify.log.warn(`Failed to load prompts for agent "${agentName}": ${(error as Error).message}`);
        }
    }

    fastify.decorate('intentClassifier', intentClassifiers);
};

export default fp(handlersPlugin, {
    name: 'intentClassifier',
    dependencies: ['aiAgent', 'cms']
});
