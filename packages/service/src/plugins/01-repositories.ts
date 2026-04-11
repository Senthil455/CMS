import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { SqliteChatMessageRepository } from '../repositories/chat-message-repository';
import { SqliteAiResponseLogRepository } from '../repositories/ai-response-log-repository';
import { SqliteDesignStyleRepository } from '../repositories/design-style-repository';
import { SqliteSystemSettingRepository } from '../repositories/system-setting-repository';
import { SqliteAgentTaskRepository } from '../repositories/agent-task-repository';
import { config } from '../config';

const repositoriesPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting repositories plugin...');
    const prisma = fastify.prisma;

    const messageRepository = new SqliteChatMessageRepository(prisma);
    const logRepository = new SqliteAiResponseLogRepository(prisma);
    const designStyleRepository = new SqliteDesignStyleRepository(prisma);
    const systemSettingRepository = new SqliteSystemSettingRepository(prisma);
    const agentTaskRepository = new SqliteAgentTaskRepository(prisma);

    // Seed default design styles if table is empty
    await designStyleRepository.seedDefaultStyles();

    fastify.decorate('chatMessageRepository', messageRepository);
    fastify.decorate('aiResponseLogRepository', logRepository);
    fastify.decorate('designStyleRepository', designStyleRepository);
    fastify.decorate('systemSettingRepository', systemSettingRepository);
    fastify.decorate('agentTaskRepository', agentTaskRepository);
};

export default fp(repositoriesPlugin, {
    name: 'repositories',
    dependencies: ['prisma']
});
