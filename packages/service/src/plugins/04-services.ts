import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { SqliteChatMessageRepository } from '../repositories/chat-message-repository';
import { SqliteAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import { SqliteDesignStyleRepository } from '../repositories/design-style-repository';
import { SqliteSystemSettingRepository } from '../repositories/system-setting-repository';
import { SqliteAgentTaskRepository } from '../repositories/agent-task-repository';
import { OrchestratorService } from '../services/orchestrator-service';
import { AuthService } from '../services/auth-service';
import { SocketService } from '../services/socket-service';
import { statusService } from '../services/status-service';

import { TaskOperator } from '../operators/task-operator';

import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting services plugin...');
    const prisma = fastify.prisma;

    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const messageRepository = new SqliteChatMessageRepository(prisma);
    const logRepository = new SqliteAiResponseLogRepository(prisma);
    const designStyleRepository = new SqliteDesignStyleRepository(prisma);
    const systemSettingRepository = new SqliteSystemSettingRepository(prisma);
    const agentTaskRepository = new SqliteAgentTaskRepository(prisma);

    // Seed default design styles if table is empty
    await designStyleRepository.seedDefaultStyles();

    const cmsClient = fastify.cms;
    const intentClassifier = fastify.intentClassifier;

    const orchestratorService = new OrchestratorService(
        messageRepository,
        logRepository,
        intentClassifier,
        // @ts-ignore
        fastify.chatHandlers,
        statusService,
        serviceLogger,
        new TaskOperator(agentTaskRepository, serviceLogger),
        cmsClient
    );
    const authService = new AuthService(cmsClient, serviceLogger);
    const socketService = new SocketService(fastify.io);

    fastify.decorate('chatMessageRepository', messageRepository);
    fastify.decorate('aiResponseLogRepository', logRepository);
    fastify.decorate('designStyleRepository', designStyleRepository);
    fastify.decorate('systemSettingRepository', systemSettingRepository);
    fastify.decorate('agentTaskRepository', agentTaskRepository);

    fastify.decorate('orchestratorService', orchestratorService);
    fastify.decorate('authService', authService);
    fastify.decorate('socketService', socketService);
    fastify.decorate('statusService', statusService);
};

export default fp(servicesPlugin, {
    name: 'services',
    dependencies: ['intentClassifier', 'cms', 'prisma']
});
