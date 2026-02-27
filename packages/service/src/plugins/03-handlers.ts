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
import { PAGE_ADDON_REGISTRY } from '../models/agents/page-addons/index';
import { PageAddonBuilder } from '../models/agents/page-addons/PageAddonBuilder';
import { BaseAgent } from '../models/agents/chat-assistant';

// ArchitectDesignerAgent import removed
// removed HtmlGenerationHandler import

const handlersPlugin: FastifyPluginAsync = async (fastify) => {
    const providers = fastify.aiProvider;
    const cmsClient = fastify.cms;
    const modelLogger = fastify.log.child({ component: 'MODEL' }, { level: config.LOG_LEVEL_MODEL });

    // Resolve directories
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const agentsDir = path.join(__dirname, '../models/agents');
    const schemasDir = path.join(__dirname, '../../resources/schemas');

    // Load common schemas
    const [entitySchema, attributeSchema, relationshipSchema] = await Promise.all([
        fs.readFile(path.join(schemasDir, 'entity.json'), 'utf-8'),
        fs.readFile(path.join(schemasDir, 'attribute.json'), 'utf-8'),
        fs.readFile(path.join(schemasDir, 'relationship.json'), 'utf-8'),
    ]);

    const loadPrompt = async (fileName: string) => {
        try {
            return await fs.readFile(path.join(agentsDir, fileName), 'utf-8');
        } catch (err) {
            fastify.log.warn(`Prompt ${fileName} not found in agents folder, using empty string`);
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
        loadPrompt('entity-designer.md'),
        loadPrompt('intent-classifier.md'),
        loadPrompt('query-builder.md'),
        loadPrompt('data-synthesizer.md'),
        loadPrompt('page-architect.md'),
        loadPrompt('page-planner.md'),
        loadPrompt('page-builder.md'),
    ]);

    const intentClassifiers: Record<string, IntentClassifier> = {};

    for (const [providerName, provider] of Object.entries(providers)) {
        try {

            // DB-backed style lookup function
            const prisma = fastify.prisma;
            const getStylePrompt = async (styleName: string, pageType: string): Promise<string> => {
                if (!styleName) return '';
                const style = await prisma.designStyle.findUnique({ where: { name: styleName } });
                if (!style) return '';
                return pageType === 'detail' ? (style.detailPrompt || '') : (style.listPrompt || '');
            };

            // Load template options from DB for PagePlanner
            const getTemplateOptions = async (): Promise<{ id: string; name: string; description: string }[]> => {
                const styles = await prisma.designStyle.findMany({ orderBy: { name: 'asc' } });
                return styles.map((s: any) => ({ id: s.name, name: s.displayName, description: s.description }));
            };

            const pageAddonsDir = path.join(__dirname, '../models/agents/page-addons');

            // Build addon handlers from registry
            const addonHandlers: Record<string, BaseAgent<any>> = {};
            for (const addon of PAGE_ADDON_REGISTRY) {
                let prompt = '';
                try {
                    prompt = await fs.readFile(path.join(pageAddonsDir, addon.resourceDir, 'prompt.md'), 'utf-8');
                } catch (err) {
                    fastify.log.warn(`Prompt for addon ${addon.id} not found at ${addon.resourceDir}/prompt.md`);
                }

                let snippet: string | undefined = undefined;
                if (addon.hasSnippet) {
                    try {
                        snippet = await fs.readFile(path.join(pageAddonsDir, addon.resourceDir, 'snippet.html'), 'utf-8');
                    } catch (err) {
                        fastify.log.warn(`Snippet for addon ${addon.id} not found at ${addon.resourceDir}/snippet.html`);
                    }
                }

                addonHandlers[addon.agentName] = new PageAddonBuilder(addon, provider, prompt, snippet, cmsClient, modelLogger);
            }

            // Create a map of addon handlers keyed by their ID for the PageBuilder
            const addonHandlersById: Record<string, BaseAgent<any>> = {};
            for (const addon of PAGE_ADDON_REGISTRY) {
                const handler = addonHandlers[addon.agentName];
                if (handler) {
                    addonHandlersById[addon.id] = handler;
                }
            }

            const pageArchitectAgent = new PageArchitect(provider, pageArchitectPrompt, cmsClient, modelLogger);

            const pageBuilderAgent = new PageBuilder(provider, htmlGeneratorPrompt, getStylePrompt, cmsClient, modelLogger, config.CMS_BASE_URL, addonHandlersById);


            const entityGenerator = new EntityGenerator(provider, entityGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const queryGenerator = new QueryGenerator(provider, queryGeneratorPrompt, cmsClient, modelLogger);
            const pagePlannerAgent = new PagePlanner(provider, pagePlannerPrompt, modelLogger, getTemplateOptions, cmsClient);
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
                [AGENT_NAMES.PAGE_ARCHITECT]: pageArchitectAgent,
                ...addonHandlers,
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
