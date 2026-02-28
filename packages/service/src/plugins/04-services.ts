import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { SqliteChatMessageRepository } from '../repositories/chat-message-repository';
import { SqliteAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import { SqliteDesignStyleRepository } from '../repositories/design-style-repository';
import { SqliteSystemSettingRepository } from '../repositories/system-setting-repository';
import { ChatService } from '../services/chat-service';
import { AuthService } from '../services/auth-service';
import { SocketService } from '../services/socket-service';
import { statusService } from '../services/status-service';

import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting services plugin...');
    const prisma = fastify.prisma;

    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const messageRepository = new SqliteChatMessageRepository(prisma);
    const logRepository = new SqliteAiResponseLogRepository(prisma);
    const designStyleRepository = new SqliteDesignStyleRepository(prisma);
    const systemSettingRepository = new SqliteSystemSettingRepository(prisma);

    fastify.decorate('systemSettingRepository', systemSettingRepository);

    // Seed default design styles if table is empty
    await designStyleRepository.seedDefaultStyles();

    const cmsClient = fastify.cms;
    const intentClassifier = fastify.intentClassifier;

    const chatService = new ChatService(
        messageRepository,
        logRepository,
        cmsClient,
        intentClassifier,
        // @ts-ignore
        fastify.chatHandlers,
        statusService,
        serviceLogger,
        prisma
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
