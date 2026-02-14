import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const configRouter: FastifyPluginAsync = async (fastify) => {
    // GET /cmsapi/config/gemini - Check status
    fastify.get('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const geminiAgent = fastify.aiProvider['gemini'];
        if (!geminiAgent) {
            return {
                success: true,
                data: { configured: false, available: false }
            };
        }

        const isConfigured = geminiAgent.hasApiKey ? geminiAgent.hasApiKey() : false;
        const maskedKey = geminiAgent.getMaskedApiKey ? geminiAgent.getMaskedApiKey() : null;

        return {
            success: true,
            data: {
                configured: isConfigured,
                maskedKey: maskedKey,
                available: true
            }
        };
    });

    // PUT /cmsapi/config/gemini - Update key
    const updateSchema = z.object({
        apiKey: z.string().min(1)
    });

    fastify.put('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const body_ = updateSchema.safeParse(request.body);
        if (!body_.success) {
            return reply.status(400).send({ error: 'Invalid request body' });
        }

        const { apiKey } = body_.data;
        const geminiAgent = fastify.aiProvider['gemini'];

        if (!geminiAgent) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        if (geminiAgent.setApiKey) {
            // Save to database
            await fastify.prisma.systemSetting.upsert({
                where: { key: 'GEMINI_API_KEY' },
                update: { value: apiKey },
                create: { key: 'GEMINI_API_KEY', value: apiKey }
            });

            // Update in-memory
            geminiAgent.setApiKey(apiKey);
            fastify.log.info('Gemini API Key updated via API and saved to DB');
            return { success: true };
        } else {
            return reply.status(501).send({ error: 'Gemini agent does not support runtime configuration' });
        }
    });

    // DELETE /cmsapi/config/gemini - Delete key
    fastify.delete('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const geminiAgent = fastify.aiProvider['gemini'];

        if (!geminiAgent) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        if (geminiAgent.setApiKey) {
            // Remove from database
            await fastify.prisma.systemSetting.deleteMany({
                where: { key: 'GEMINI_API_KEY' }
            });

            // Reset in-memory (empty string or revert to env if desired, but here we clear it to match user intent)
            geminiAgent.setApiKey('');
            fastify.log.info('Gemini API Key deleted via API');
            return { success: true };
        } else {
            return reply.status(501).send({ error: 'Gemini agent does not support runtime configuration' });
        }
    });
};

export default configRouter;
