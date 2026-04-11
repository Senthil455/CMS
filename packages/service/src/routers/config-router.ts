import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../config';
import { maskApiKey } from '../utils/mask-api-key';

const analyticsSettingsSchema = z.object({
    enabled: z.boolean(),
    measurementId: z.string()
});

const configRouter: FastifyPluginAsync = async (fastify) => {
    // GET /cmsapi/config/analytics - Get GA settings
    fastify.get('/cmsapi/config/analytics', {
        preHandler: [fastify.authenticate]
    }, async (_request, _reply) => {
        const enabled = await fastify.systemSettingRepository.get('ENABLE_GOOGLE_ANALYTICS');
        const measurementId = await fastify.systemSettingRepository.get('GA_MEASUREMENT_ID');
        return {
            success: true,
            data: {
                enabled: enabled === 'true',
                measurementId: measurementId ?? ''
            }
        };
    });

    // PUT /cmsapi/config/analytics - Save GA settings
    fastify.put('/cmsapi/config/analytics', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const body_ = analyticsSettingsSchema.safeParse(request.body);
        if (!body_.success) {
            return reply.status(400).send({ error: 'Invalid request body' });
        }
        const { enabled, measurementId } = body_.data;
        await fastify.systemSettingRepository.upsert('ENABLE_GOOGLE_ANALYTICS', enabled ? 'true' : 'false');
        await fastify.systemSettingRepository.upsert('GA_MEASUREMENT_ID', measurementId);
        fastify.log.info(`Google Analytics settings updated: enabled=${enabled}, id=${measurementId}`);
        return { success: true };
    });


    // GET /cmsapi/config/gemini - Check status
    fastify.get('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {

        const currentKey = await fastify.systemSettingRepository.get('GEMINI_API_KEY');

        return {
            success: true,
            data: {
                configured: !!currentKey,
                maskedKey: maskApiKey(currentKey),
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
        const geminiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('gemini'));

        if (geminiAgents.length === 0) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        // Save to database
        await fastify.systemSettingRepository.upsert('GEMINI_API_KEY', apiKey);

        // Update in-memory: call setApiKey on existing instances so all agent references stay valid
        for (const [providerName, provider] of geminiAgents) {
            provider.setApiKey(apiKey);
            fastify.log.info(`Gemini API key updated for provider: ${providerName} (key ends with ...${apiKey.slice(-2)})`);
        }

        fastify.log.info('Gemini API Key updated via API and saved to DB');
        return { success: true };
    });

    // DELETE /cmsapi/config/gemini - Delete key
    fastify.delete('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const geminiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('gemini'));

        if (geminiAgents.length === 0) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        // Remove from database
        await fastify.systemSettingRepository.delete('GEMINI_API_KEY');

        // Reset in-memory: clear key on existing instances
        for (const [providerName, provider] of geminiAgents) {
            provider.setApiKey('');
            fastify.log.info(`Gemini API key cleared for provider: ${providerName}`);
        }

        fastify.log.info('Gemini API Key deleted via API');
        return { success: true };
    });

    // GET /cmsapi/config/openai - Check status
    fastify.get('/cmsapi/config/openai', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const openaiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('openai')).map(([_, a]) => a);
        if (openaiAgents.length === 0) {
            return {
                success: true,
                data: { configured: false, available: false }
            };
        }

        const currentKey = await fastify.systemSettingRepository.get('OPENAI_API_KEY');

        return {
            success: true,
            data: {
                configured: !!currentKey,
                maskedKey: maskApiKey(currentKey),
                available: true
            }
        };
    });

    // PUT /cmsapi/config/openai - Update key
    fastify.put('/cmsapi/config/openai', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const body_ = updateSchema.safeParse(request.body);
        if (!body_.success) {
            return reply.status(400).send({ error: 'Invalid request body' });
        }

        const { apiKey } = body_.data;
        const openaiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('openai'));

        if (openaiAgents.length === 0) {
            return reply.status(404).send({ error: 'OpenAI agent not enabled' });
        }

        // Save to database
        await fastify.systemSettingRepository.upsert('OPENAI_API_KEY', apiKey);

        // Update in-memory: call setApiKey on existing instances
        for (const [providerName, provider] of openaiAgents) {
            provider.setApiKey(apiKey);
            fastify.log.info(`OpenAI API key updated for provider: ${providerName} (key ends with ...${apiKey.slice(-2)})`);
        }

        fastify.log.info('OpenAI API Key updated via API and saved to DB');
        return { success: true };
    });

    // DELETE /cmsapi/config/openai - Delete key
    fastify.delete('/cmsapi/config/openai', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const openaiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('openai'));

        if (openaiAgents.length === 0) {
            return reply.status(404).send({ error: 'OpenAI agent not enabled' });
        }

        // Remove from database
        await fastify.systemSettingRepository.delete('OPENAI_API_KEY');

        // Reset in-memory: clear key on existing instances
        for (const [providerName, provider] of openaiAgents) {
            provider.setApiKey('');
            fastify.log.info(`OpenAI API key cleared for provider: ${providerName}`);
        }

        fastify.log.info('OpenAI API Key deleted via API');
        return { success: true };
    });
};

export default configRouter;
