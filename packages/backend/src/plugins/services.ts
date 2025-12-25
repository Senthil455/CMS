import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { SqliteChatRepository } from '../infrastructures/sqlite-chat-repository';
import { ChatService } from '../services/chat-service';
import { AuthService } from '../services/auth-service';
import { QwenAgent } from '../infrastructures/qwen-agent';
import { StubAgent } from '../infrastructures/stub-agent';
import { OpenAIAgent } from '../infrastructures/openai-agent';
import { CmsClient } from '../infrastructures/cms-client';
import { GLMAgent } from '../infrastructures/glm-agent';
import { HandlerResolver } from '../models/handlers/handler-resolver';
import { SystemDesigner } from '../models/handlers/system-designer';
import { ModelExplorer } from '../models/handlers/model-explorer';

import type { ChatHandler } from '../models/handlers/chat-handler';
import type { AIAgent } from '../infrastructures/agent.interface';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting services plugin...');
    const prisma = new PrismaClient();

    const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
    const modelLogger = fastify.log.child({ component: 'MODEL' }, { level: config.LOG_LEVEL_MODEL });
    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const repository = new SqliteChatRepository(prisma);
    const cmsClient = new CmsClient(config.CMS_BASE_URL);

    // Resolve assets directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const assetsDir = path.join(__dirname, '../../assets');

    const supportedAgents = ['stub', 'openai', 'glm', 'qwen'];
    let agent: AIAgent;
    if (config.AI_AGENT === 'stub') {
        agent = new StubAgent();
    } else if (config.AI_AGENT === 'openai') {
        agent = new OpenAIAgent(
            config.OPENAI_API_KEY || '',
            config.OPENAI_API_URL,
            config.OPENAI_MODEL,
            infraLogger
        );
    } else if (config.AI_AGENT === 'glm') {
        agent = new GLMAgent(
            config.GLM_API_URL,
            config.GLM_MODEL,
            infraLogger
        );
    } else if (config.AI_AGENT === 'qwen') {
        agent = new QwenAgent(
            config.QWEN_API_KEY || '',
            config.QWEN_API_URL,
            config.QWEN_MODEL,
            infraLogger
        );
    } else {
        const errorMsg = `❌ Unsupported AI_AGENT: ${config.AI_AGENT}. Valid options are: ${supportedAgents.join(', ')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const aiConfig = {
        agent: config.AI_AGENT,
        model: config.AI_AGENT === 'openai' ? config.OPENAI_MODEL :
            config.AI_AGENT === 'glm' ? config.GLM_MODEL :
                config.AI_AGENT === 'stub' ? 'stub' : config.QWEN_MODEL,
        url: config.AI_AGENT === 'openai' ? config.OPENAI_API_URL :
            config.AI_AGENT === 'glm' ? config.GLM_API_URL :
                config.AI_AGENT === 'stub' ? 'N/A' : config.QWEN_API_URL
    };
    fastify.log.info(aiConfig, 'AI Configuration details');

    // Load assets for ChatService and AgentResolver
    const promptSubDir = config.AI_AGENT === 'openai' ? 'openai' : config.AI_AGENT === 'glm' ? 'glm' : config.AI_AGENT === 'stub' ? 'stub' : 'qwen';
    const [systemDesignerPrompt, handlerResolverPrompt,
        entitySchema, attributeSchema, relationshipSchema] = await Promise.all([
            fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/system-designer.txt`), 'utf-8'),
            fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/agent-resolver.txt`), 'utf-8'),
            fs.readFile(path.join(assetsDir, 'schemas/entity.json'), 'utf-8'),
            fs.readFile(path.join(assetsDir, 'schemas/attribute.json'), 'utf-8'),
            fs.readFile(path.join(assetsDir, 'schemas/relationship.json'), 'utf-8'),
        ]);

    const systemDesigner = new SystemDesigner(agent, systemDesignerPrompt, entitySchema, attributeSchema, relationshipSchema, cmsClient, modelLogger);
    const modelExplorer = new ModelExplorer(cmsClient, modelLogger);


    const handlerResolver = new HandlerResolver(
        agent,
        handlerResolverPrompt,
        {
            design: systemDesigner,
            list: modelExplorer,
        }
    );
    const chatService = new ChatService(
        repository,
        cmsClient,
        handlerResolver,
        serviceLogger
    );
    const authService = new AuthService(cmsClient, serviceLogger);

    fastify.decorate('chatService', chatService);
    fastify.decorate('authService', authService);

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};

export default fp(servicesPlugin);
