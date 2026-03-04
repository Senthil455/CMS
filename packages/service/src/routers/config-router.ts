import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config, GEMINI_MODELS, OPENAI_MODELS } from '../config';
import { maskApiKey } from '../utils/mask-api-key';
import { GeminiProvider } from '../infrastructures/gemini-provider';
import { OpenAIProvider } from '../infrastructures/openai-provider';

const configRouter: FastifyPluginAsync = async (fastify) => {
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
        const geminiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('gemini')).map(([_, a]) => a);

        if (geminiAgents.length === 0) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        // Save to database
        await fastify.systemSettingRepository.upsert('GEMINI_API_KEY', apiKey);

        // Update in-memory: Instantiate new GeminiProviders for each model
        const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
        for (const model of GEMINI_MODELS) {
            fastify.aiProvider[`gemini/${model}`] = new GeminiProvider(
                apiKey,
                config.GEMINI_API_URL,
                model,
                infraLogger,
                config.GEMINI_USE_CACHING
            );
        }

        fastify.log.info('Gemini API Key updated via API and saved to DB');
        return { success: true };
    });

    // DELETE /cmsapi/config/gemini - Delete key
    fastify.delete('/cmsapi/config/gemini', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const geminiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('gemini')).map(([_, a]) => a);

        if (geminiAgents.length === 0) {
            return reply.status(404).send({ error: 'Gemini agent not enabled' });
        }

        // Remove from database
        await fastify.systemSettingRepository.delete('GEMINI_API_KEY');

        // Reset in-memory: Instantiate empty providers
        const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
        for (const model of GEMINI_MODELS) {
            fastify.aiProvider[`gemini/${model}`] = new GeminiProvider(
                '',
                config.GEMINI_API_URL,
                model,
                infraLogger,
                config.GEMINI_USE_CACHING
            );
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
        const openaiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('openai')).map(([_, a]) => a);

        if (openaiAgents.length === 0) {
            return reply.status(404).send({ error: 'OpenAI agent not enabled' });
        }

        // Save to database
        await fastify.systemSettingRepository.upsert('OPENAI_API_KEY', apiKey);

        // Update in-memory
        const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
        for (const model of OPENAI_MODELS) {
            fastify.aiProvider[`openai/${model}`] = new OpenAIProvider(
                apiKey,
                config.OPENAI_API_URL,
                model,
                infraLogger
            );
        }

        fastify.log.info('OpenAI API Key updated via API and saved to DB');
        return { success: true };
    });

    // DELETE /cmsapi/config/openai - Delete key
    fastify.delete('/cmsapi/config/openai', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const openaiAgents = Object.entries(fastify.aiProvider).filter(([k]) => k.startsWith('openai')).map(([_, a]) => a);

        if (openaiAgents.length === 0) {
            return reply.status(404).send({ error: 'OpenAI agent not enabled' });
        }

        // Remove from database
        await fastify.systemSettingRepository.delete('OPENAI_API_KEY');

        // Reset in-memory
        const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
        for (const model of OPENAI_MODELS) {
            fastify.aiProvider[`openai/${model}`] = new OpenAIProvider(
                '',
                config.OPENAI_API_URL,
                model,
                infraLogger
            );
        }
        fastify.log.info('OpenAI API Key deleted via API');
        return { success: true };
    });
};

export default configRouter;
