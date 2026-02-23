import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { SqliteChatRepository } from '../infrastructures/sqlite-chat-repository';
import { ChatService } from '../services/chat-service';
import { AuthService } from '../services/auth-service';
import { SocketService } from '../services/socket-service';
import { statusService } from '../services/status-service';

import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting services plugin...');
    const prisma = fastify.prisma;

    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const repository = new SqliteChatRepository(prisma);

    // Seed default design styles if table is empty
    await repository.seedDefaultStyles();

    const cmsClient = fastify.cms;
    const intentClassifier = fastify.intentClassifier;

    const chatService = new ChatService(
        repository,
        cmsClient,
        intentClassifier,
        // @ts-ignore
        fastify.chatHandlers,
        statusService,
        serviceLogger
    );
    const authService = new AuthService(cmsClient, serviceLogger);
    const socketService = new SocketService(fastify.io);

    fastify.decorate('chatService', chatService);
    fastify.decorate('authService', authService);
    fastify.decorate('socketService', socketService);
    fastify.decorate('statusService', statusService);
};

export default fp(servicesPlugin, {
    name: 'services',
    dependencies: ['intentClassifier', 'cms', 'prisma']
});
