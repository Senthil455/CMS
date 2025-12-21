import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { SqliteChatRepository } from '../infrastructures/sqlite-chat-repository';
import { ChatService } from '../services/chat-service';

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
    const prisma = new PrismaClient();
    await prisma.$connect();

    const repository = new SqliteChatRepository(prisma);
    const chatService = new ChatService(repository);

    fastify.decorate('chatService', chatService);

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};

export default fp(servicesPlugin);
