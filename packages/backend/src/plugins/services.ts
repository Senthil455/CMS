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
import { AgentResolver } from '../models/agent-resolver';
import { EntityCreator } from '../models/entity-creator';
import type { ChatAgent } from '../models/chat-agent';
import type { IAgent } from '../infrastructures/agent.interface';
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

    let agent: IAgent;
    if (config.AI_AGENT === 'stub') {
        agent = new StubAgent();
    } else if (config.AI_AGENT === 'openai') {
        agent = new OpenAIAgent(
            config.OPENAI_API_KEY || '',
            config.OPENAI_API_URL,
            config.OPENAI_MODEL,
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

    // Load assets for ChatService and AgentResolver
    const promptSubDir = config.AI_AGENT === 'openai' ? 'openai' : 'qwen';
    const [createEntityPrompt, resolveCommandPrompt, entitySchema, attributeSchema] = await Promise.all([
        fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/create-entity.txt`), 'utf-8'),
        fs.readFile(path.join(assetsDir, `prompts/${promptSubDir}/resolve-command.txt`), 'utf-8'),
        fs.readFile(path.join(assetsDir, 'schemas/entity.json'), 'utf-8'),
        fs.readFile(path.join(assetsDir, 'schemas/attribute.json'), 'utf-8'),
    ]);

    const entityCreator = new EntityCreator(agent, createEntityPrompt, entitySchema, attributeSchema);

    const agentMap: Record<string, ChatAgent> = {
        list: entityCreator,
        add: entityCreator,
        edit: entityCreator,
        delete: entityCreator,
        design: entityCreator
    };

    const agentResolver = new AgentResolver(agent, resolveCommandPrompt, agentMap);
    const chatService = new ChatService(
        repository,
        cmsClient,
        agentResolver,
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
