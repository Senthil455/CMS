import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { SqliteChatRepository } from '../infrastructures/sqlite-chat-repository';
import { ChatService } from '../services/chat-service';
import { AuthService } from '../services/auth-service';

import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting services plugin...');
    const prisma = new PrismaClient();

    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const repository = new SqliteChatRepository(prisma);
    const cmsClient = fastify.cms;
    const intentClassifier = fastify.intentClassifier;

    const chatService = new ChatService(
        repository,
        cmsClient,
        intentClassifier,
        // @ts-ignore
        fastify.chatHandlers,
        serviceLogger
    );
    const authService = new AuthService(cmsClient, serviceLogger);

    fastify.decorate('chatService', chatService);
    fastify.decorate('authService', authService);

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};

export default fp(servicesPlugin, {
    name: 'services',
    dependencies: ['intentClassifier', 'cms']
});
