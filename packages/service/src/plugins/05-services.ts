import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { OrchestratorService } from '../services/orchestrator-service';
import { AuthService } from '../services/auth-service';
import { SocketService } from '../services/socket-service';
import { statusService } from '../services/status-service';

import { config } from '../config';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting services plugin...');
    
    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const messageRepository = fastify.chatMessageRepository;
    const logRepository = fastify.aiResponseLogRepository;
    
    const cmsClient = fastify.cms;
    const intentClassifier = fastify.intentClassifier;
    const taskOperator = fastify.taskOperator;

    const orchestratorService = new OrchestratorService(
        messageRepository,
        logRepository,
        intentClassifier,
        // @ts-ignore
        fastify.chatHandlers,
        statusService,
        serviceLogger,
        taskOperator,
        cmsClient
    );
    
    const authService = new AuthService(cmsClient, serviceLogger);
    const socketService = new SocketService(fastify.io);

    fastify.decorate('orchestratorService', orchestratorService);
    fastify.decorate('authService', authService);
    fastify.decorate('socketService', socketService);
    fastify.decorate('statusService', statusService);
};

export default fp(servicesPlugin, {
    name: 'services',
    dependencies: ['infrastructure', 'repositories', 'operators', 'agents']
});
