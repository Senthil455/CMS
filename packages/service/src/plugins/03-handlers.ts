import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { AGENT_NAMES } from '@cms/shared';

import { IntentClassifier } from '../models/agents/intent-classifier';
import { EntityGenerator } from '../models/agents/entity-designer';

import { QueryGenerator } from '../models/agents/query-builder';
import { PagePlanner } from '../models/agents/page-planner';
// PageArchitect import removed
import { PageArchitect } from '../models/agents/page-architect';
import { PageBuilder } from '../models/agents/page-builder';
import { DataGenerator } from '../models/agents/data-synthesizer';
import { EngagementBarBuilder } from '../models/agents/engagement-bar-builder';
import { UserAvatarBuilder } from '../models/agents/user-avatar-builder';
import { VisitTracker } from '../models/agents/visit-tracker';
import { TopListBuilder } from '../models/agents/top-list-builder';

// ArchitectDesignerAgent import removed
// removed HtmlGenerationHandler import

const handlersPlugin: FastifyPluginAsync = async (fastify) => {
    const providers = fastify.aiProvider;
    const cmsClient = fastify.cms;
    const modelLogger = fastify.log.child({ component: 'MODEL' }, { level: config.LOG_LEVEL_MODEL });

    // Resolve directories
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const promptsDir = path.join(__dirname, '../../resources/prompts');
    const schemasDir = path.join(__dirname, '../../resources/schemas');

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
                pagePlannerPrompt,
                htmlGeneratorPrompt,
            ] = await Promise.all([
                fs.readFile(path.join(promptsDir, `${promptSubDir}/entity-generator.md`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/intent-classifier.md`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/query-generator.md`), 'utf-8'),
                fs.readFile(path.join(promptsDir, `${promptSubDir}/data-generator.md`), 'utf-8'),
                loadPrompt('page-architect.md'),
                loadPrompt('page-planner.md'),
                loadPrompt('page-builder.md'),
            ]);

            const [
                modernListPrompt,
                modernDetailPrompt,
                classicListPrompt,
                classicDetailPrompt,
                minimalListPrompt,
                minimalDetailPrompt
            ] = await Promise.all([
                fs.readFile(path.join(promptsDir, 'styles/modern-editorial-list.md'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/modern-editorial-detail.md'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/classic-newspaper-list.md'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/classic-newspaper-detail.md'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/minimalist-visual-list.md'), 'utf-8'),
                fs.readFile(path.join(promptsDir, 'styles/minimalist-visual-detail.md'), 'utf-8'),
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

            const userAvatarPrompt = await fs.readFile(path.join(promptsDir, `${promptSubDir}/user-avatar-agent.md`), 'utf-8').catch(() => '');
            const engagementBarPrompt = await fs.readFile(path.join(promptsDir, `${promptSubDir}/engagement-bar-agent.md`), 'utf-8').catch(() => '');
            const visitTrackPrompt = await fs.readFile(path.join(promptsDir, `${promptSubDir}/visit-track-agent.md`), 'utf-8').catch(() => '');
            const topListPrompt = await fs.readFile(path.join(promptsDir, `${promptSubDir}/top-list-agent.md`), 'utf-8').catch(() => '');
            const engagementBarSnippet = await fs.readFile(path.join(promptsDir, 'components/engagement-bar.html'), 'utf-8').catch(() => '');
            const userAvatarSnippet = await fs.readFile(path.join(promptsDir, 'components/user-avatar.html'), 'utf-8').catch(() => '');
            const topListSnippet = await fs.readFile(path.join(promptsDir, 'components/top-list.html'), 'utf-8').catch(() => '');


            // Instantiate Planners
            // PagePlanner instantiation removed
            // PageArchitect instantiation removed

            const engagementBarGenerator = new EngagementBarBuilder(provider, engagementBarPrompt, engagementBarSnippet, cmsClient, modelLogger);
            const userAvatarGenerator = new UserAvatarBuilder(provider, userAvatarPrompt, userAvatarSnippet, cmsClient, modelLogger);
            const visitTrackGenerator = new VisitTracker(provider, visitTrackPrompt, cmsClient, modelLogger);
            const topListGenerator = new TopListBuilder(provider, topListPrompt, topListSnippet, cmsClient, modelLogger);

            const pageArchitectAgent = new PageArchitect(provider, pageArchitectPrompt, cmsClient, modelLogger);

            const pageBuilderAgent = new PageBuilder(provider, htmlGeneratorPrompt, styleMap, cmsClient, modelLogger, config.CMS_BASE_URL);


            const dataDir = path.join(__dirname, '../../resources/data');
            const templatesData = await fs.readFile(path.join(dataDir, 'page-templates.json'), 'utf-8');
            const templates = JSON.parse(templatesData);

            const entityGenerator = new EntityGenerator(provider, entityGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const queryGenerator = new QueryGenerator(provider, queryGeneratorPrompt, cmsClient, modelLogger);
            const pagePlannerAgent = new PagePlanner(provider, pagePlannerPrompt, modelLogger, templates, cmsClient);
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
                [AGENT_NAMES.ENTITY_DESIGNER]: entityGenerator,
                [AGENT_NAMES.QUERY_BUILDER]: queryGenerator,
                [AGENT_NAMES.PAGE_PLANNER]: pagePlannerAgent,
                [AGENT_NAMES.DATA_SYNTHESIZER]: dataGenerator,
                [AGENT_NAMES.PAGE_BUILDER]: pageBuilderAgent,
                [AGENT_NAMES.ENGAGEMENT_BAR_BUILDER]: engagementBarGenerator,
                [AGENT_NAMES.USER_AVATAR_BUILDER]: userAvatarGenerator,
                [AGENT_NAMES.VISIT_TRACKER]: visitTrackGenerator,
                [AGENT_NAMES.TOP_LIST_BUILDER]: topListGenerator,

                [AGENT_NAMES.PAGE_ARCHITECT]: pageArchitectAgent,
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
