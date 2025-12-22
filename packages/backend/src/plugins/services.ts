import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { SqliteChatRepository } from '../infrastructures/sqlite-chat-repository';
import { ChatService } from '../services/chat-service';
import { AuthService } from '../services/auth-service';
import { QwenAgent } from '../infrastructures/qwen-agent';
import { CmsClient } from '../infrastructures/cms-client';
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

    const agent = new QwenAgent(
        config.QWEN_API_KEY || '',
        config.QWEN_API_URL,
        config.QWEN_MODEL,
        fastify.log
    );

    // Load assets for ChatService
    const [prompt, entitySchema, attributeSchema] = await Promise.all([
        fs.readFile(path.join(assetsDir, 'prompts/qwen-entity.txt'), 'utf-8'),
        fs.readFile(path.join(assetsDir, 'schemas/entity.json'), 'utf-8'),
        fs.readFile(path.join(assetsDir, 'schemas/attribute.json'), 'utf-8'),
    ]);

    const chatService = new ChatService(repository, agent, cmsClient, prompt, entitySchema, attributeSchema, fastify.log);
    const authService = new AuthService(cmsClient, fastify.log);

    fastify.decorate('chatService', chatService);
    fastify.decorate('authService', authService);


    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};

export default fp(servicesPlugin);
