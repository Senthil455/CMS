import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { AGENT_NAMES } from '@cms/shared';

import { IntentClassifier } from '../models/agents/intent-classifier';
import { EntityGenerator } from '../models/agents/entity-generator-agent';

import { QueryGenerator } from '../models/agents/query-generator-agent';
import { PageGenerator } from '../models/agents/page-generator-agent';
import { RouterDesigner } from '../models/planners/router-designer-planner';
import { PageArchitect } from '../models/planners/page-architect-planner';
import { PageTypePlanner } from '../models/planners/page-type-planner';
import { HtmlGenerator } from '../models/agents/html-generator-agent';
import { DataGenerator } from '../models/agents/data-generator-agent';
import { EngagementBarAgent } from '../models/agents/engagement-bar-agent';
import { UserAvatarAgent } from '../models/agents/user-avatar-agent';
import { RouterDesignerAgent } from '../models/agents/router-designer-agent';
import { ArchitectDesignerAgent } from '../models/agents/architect-designer-agent';
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
                htmlGeneratorPrompt,
                pageTypePlannerPrompt
            ] = await Promise.all([
                fs.readFile(path.join(promptsDir, `${promptSubDir}/entity-generator.txt`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/intent-classifier.txt`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/query-generator.txt`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/data-generator.txt`), 'utf-8'),
                loadPrompt('page-architect.txt'),
                loadPrompt('router-designer.txt'),
                loadPrompt('html-generator.txt'),
                loadPrompt('page-type-planner.txt'),
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

            const userAvatarPrompt = await fs.readFile(path.join(promptsDir, `${promptSubDir}/user-avatar-agent.txt`), 'utf-8').catch(() => '');
            const engagementBarPrompt = await fs.readFile(path.join(promptsDir, `${promptSubDir}/engagement-bar-agent.txt`), 'utf-8').catch(() => '');
            const engagementBarSnippet = await fs.readFile(path.join(promptsDir, 'components/engagement-bar.html'), 'utf-8').catch(() => '');
            const userAvatarSnippet = await fs.readFile(path.join(promptsDir, 'components/user-avatar.html'), 'utf-8').catch(() => '');


            // Instantiate Planners
            const routerDesigner = new RouterDesigner(provider, routerDesignerPrompt);
            const pageArchitect = new PageArchitect(provider, pageArchitectPrompt);
            const pageTypePlanner = new PageTypePlanner(provider, pageTypePlannerPrompt);

            const engagementBarAgent = new EngagementBarAgent(provider, engagementBarPrompt, engagementBarSnippet, cmsClient, modelLogger);
            const userAvatarAgent = new UserAvatarAgent(provider, userAvatarPrompt, userAvatarSnippet, cmsClient, modelLogger);
            const routerDesignerAgent = new RouterDesignerAgent(provider, routerDesigner, cmsClient, modelLogger);
            const architectDesignerAgent = new ArchitectDesignerAgent(provider, pageArchitect, cmsClient, modelLogger);

            const htmlGenerator = new HtmlGenerator(provider, htmlGeneratorPrompt, styleMap, cmsClient, modelLogger, config.CMS_BASE_URL, userAvatarSnippet);


            const dataDir = path.join(__dirname, '../data');
            const templatesData = await fs.readFile(path.join(dataDir, 'templates.json'), 'utf-8');
            const templates = JSON.parse(templatesData);

            const entityGenerator = new EntityGenerator(provider, entityGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const queryGenerator = new QueryGenerator(provider, queryGeneratorPrompt, cmsClient, modelLogger);
            const pageGenerator = new PageGenerator(provider, pageTypePlanner, modelLogger, templates, cmsClient);
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
            // @ts-ignore
            fastify.chatHandlers[providerName] = {
                [AGENT_NAMES.ENTITY_GENERATOR]: entityGenerator,
                [AGENT_NAMES.QUERY_GENERATOR]: queryGenerator,
                [AGENT_NAMES.PAGE_GENERATOR]: pageGenerator,
                [AGENT_NAMES.DATA_GENERATOR]: dataGenerator,
                [AGENT_NAMES.HTML_GENERATOR]: htmlGenerator,
                [AGENT_NAMES.ENGAGEMENT_BAR_AGENT]: engagementBarAgent,
                [AGENT_NAMES.USER_AVATAR_AGENT]: userAvatarAgent,
                [AGENT_NAMES.ROUTER_DESIGNER]: routerDesignerAgent,
                [AGENT_NAMES.ARCHITECT_DESIGNER]: architectDesignerAgent,
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
