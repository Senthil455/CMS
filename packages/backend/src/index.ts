import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyIO from 'fastify-socket.io';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
    logger: true,
});

async function start() {
    try {
        // Register CORS
        await server.register(cors, {
            origin: '*', // For demo, strictly should be frontend URL
        });

        // Register Socket.io
        await server.register(fastifyIO, {
            cors: {
                origin: '*',
            },
        });

        // Register Plugins (DI, etc.)
        await server.register(autoload, {
            dir: join(__dirname, 'plugins'),
        });

        // Register Routers
        await server.register(autoload, {
            dir: join(__dirname, 'routers'),
        });

        await server.listen({ port: config.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server ready at http://localhost:${config.PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();
