
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

import { config } from '../config';

const databasePlugin: FastifyPluginAsync = async (fastify) => {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: config.DATABASE_URL,
            },
        },
    });

    try {
        await prisma.$connect();
        fastify.log.info('Database connected successfully');
    } catch (err) {
        fastify.log.error(err, 'Failed to connect to database');
        process.exit(1);
    }

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async (instance) => {
        await instance.prisma.$disconnect();
    });
};

export default fp(databasePlugin, {
    name: 'prisma'
});
