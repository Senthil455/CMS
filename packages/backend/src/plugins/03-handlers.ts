import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';

import { IntentClassifier } from '../models/handlers/intent-classifier';
import { SchemaGenerator } from '../models/handlers/schema-generator';
import { ModelExplorer } from '../models/handlers/model-explorer';

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
            const [schemaGeneratorPrompt, intentClassifierPrompt] = await Promise.all([
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/schema-generator.txt`), 'utf-8'),
                fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/intent-classifier.txt`), 'utf-8'),
            ]);

            const schemaGenerator = new SchemaGenerator(agent, schemaGeneratorPrompt,
                entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
            const modelExplorer = new ModelExplorer(cmsClient, modelLogger);

            const intentClassifier = new IntentClassifier(
                agent,
                intentClassifierPrompt,
                {
                    define_structure: schemaGenerator,
                    generate_query: modelExplorer,
                    design_page: modelExplorer,
                    edit_entity: modelExplorer,
                    delete_entity: modelExplorer,
                    edit_query: modelExplorer,
                    delete_query: modelExplorer,
                    edit_page: modelExplorer,
                    delete_page: modelExplorer,
                    list_entities: modelExplorer,
                    list_pages: modelExplorer,
                }
            );

            intentClassifiers[agentName] = intentClassifier;
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
