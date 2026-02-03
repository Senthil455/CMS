import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const configRouter: FastifyPluginAsync = async (fastify) => {
    // GET /cmsapi/config/gemini - Check status
    fastify.get('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const geminiAgent = fastify.aiAgent['gemini'];
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
        const geminiAgent = fastify.aiAgent['gemini'];

        if (!geminiAgent) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        if (geminiAgent.setApiKey) {
            geminiAgent.setApiKey(apiKey);
            fastify.log.info('Gemini API Key updated via API');
            return { success: true };
        } else {
            return reply.status(501).send({ error: 'Gemini agent does not support runtime configuration' });
        }
    });
};

export default configRouter;
