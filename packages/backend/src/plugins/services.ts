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
import { OrchestratorResolver } from '../models/orchestrators/orchestrator-resolver';
import { SystemDesigner } from '../models/orchestrators/system-designer';
import { ModelExplorer } from '../models/orchestrators/model-explorer';
import type { ChatOrchestrator } from '../models/orchestrators/chat-orchestrator';
import type { AIAgent } from '../infrastructures/agent.interface';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    const prisma = new PrismaClient();
    await prisma.$connect();

    const repository = new SqliteChatRepository(prisma);
    const cmsClient = new CmsClient(config.CMS_BASE_URL);

    // Resolve assets directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const assetsDir = path.join(__dirname, '../../assets');

    let agent: AIAgent;
    if (config.AI_AGENT === 'stub') {
        agent = new StubAgent();
    } else if (config.AI_AGENT === 'openai') {
        agent = new OpenAIAgent(
            config.OPENAI_API_KEY || '',
            config.OPENAI_API_URL,
            config.OPENAI_MODEL,
            fastify.log
        );
    } else if (config.AI_AGENT === 'glm') {
        agent = new GLMAgent(
            config.GLM_API_URL,
            config.GLM_MODEL,
            fastify.log
        );
    } else {
        agent = new QwenAgent(
            config.QWEN_API_KEY || '',
            config.QWEN_API_URL,
            config.QWEN_MODEL,
            fastify.log
        );
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
    const [systemDesignerPrompt, orchestratorResolverPrompt,
        entitySchema, attributeSchema, relationshipSchema] = await Promise.all([
            fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/system-designer.txt`), 'utf-8'),
            fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/agent-resolver.txt`), 'utf-8'),
            fs.readFile(path.join(assetsDir, 'schemas/entity.json'), 'utf-8'),
            fs.readFile(path.join(assetsDir, 'schemas/attribute.json'), 'utf-8'),
            fs.readFile(path.join(assetsDir, 'schemas/relationship.json'), 'utf-8'),
        ]);

    const systemDesigner = new SystemDesigner(agent, systemDesignerPrompt, entitySchema, attributeSchema, relationshipSchema, cmsClient, fastify.log);
    const modelExplorer = new ModelExplorer(cmsClient, fastify.log);

    const orchestratorMap: Record<string, ChatOrchestrator> = {
        list: modelExplorer,
        add: systemDesigner,
        edit: systemDesigner,
        delete: systemDesigner,
        design: systemDesigner
    };

    const orchestratorResolver = new OrchestratorResolver(agent, orchestratorResolverPrompt, orchestratorMap);
    const chatService = new ChatService(
        repository,
        cmsClient,
        orchestratorResolver,
        fastify.log
    );
    const authService = new AuthService(cmsClient, fastify.log);

    fastify.decorate('chatService', chatService);
    fastify.decorate('authService', authService);


    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};

export default fp(servicesPlugin);
