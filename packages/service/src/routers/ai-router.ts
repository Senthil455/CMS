import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';
import { OPENAI_MODELS, GEMINI_MODELS } from '../config';

const aiRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.PROVIDERS, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const combinations: string[] = [];
        const systemSettingRepository = (fastify as any).systemSettingRepository;

        const geminiKey = await systemSettingRepository.get('GEMINI_API_KEY');
        const openaiKey = await systemSettingRepository.get('OPENAI_API_KEY');

        if (geminiKey) {
            GEMINI_MODELS.forEach(model => combinations.push(`gemini/${model}`));
        }

        if (openaiKey) {
            OPENAI_MODELS.forEach(model => combinations.push(`openai/${model}`));
        }

        return { success: true, data: combinations };
    });
};

export default aiRouter;
