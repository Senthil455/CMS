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
import { DataGenerator } from '../models/handlers/data-generator';

const handlersPlugin: FastifyPluginAsync = async (fastify) => {
    const agents = fastify.aiAgent;
    const cmsClient = fastify.cms;
    const modelLogger = fastify.log.child({ component: 'MODEL' }, { level: config.LOG_LEVEL_MODEL });

    // Resolve assets directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const assetsDir = path.join(__dirname, '../../assets');

    // Load common schemas
    const [entitySchema, attributeSchema, relationshipSchema] = await Promise.all([
        fs.readFile(path.join(assetsDir, 'schemas/entity.json'), 'utf-8'),
        fs.readFile(path.join(assetsDir, 'schemas/attribute.json'), 'utf-8'),
        fs.readFile(path.join(assetsDir, 'schemas/relationship.json'), 'utf-8'),
    ]);

    const intentClassifiers: Record<string, IntentClassifier> = {};

    for (const [agentName, agent] of Object.entries(agents)) {
        // Load agent-specific prompts
        const promptSubDir = agentName;

        try {
            const [entityGeneratorPrompt, intentClassifierPrompt, queryGeneratorPrompt, pageGeneratorPrompt, dataGeneratorPrompt] = await Promise.all([
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/entity-generator.txt`), 'utf-8'),
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/intent-classifier.txt`), 'utf-8'),
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/query-generator.txt`), 'utf-8'),
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/page-generator.txt`), 'utf-8'),
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/data-generator.txt`), 'utf-8'),
            ]);

            const entityGenerator = new EntityGenerator(agent, entityGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const queryGenerator = new QueryGenerator(agent, queryGeneratorPrompt, cmsClient, modelLogger);
            const pageGenerator = new PageGenerator(agent, pageGeneratorPrompt, cmsClient, modelLogger, config.CMS_PUBLIC_URL);
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
