import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config, OPENAI_MODELS, GEMINI_MODELS } from '../config';

import { OpenAIProvider } from '../infrastructures/openai-provider';
import { GeminiProvider } from '../infrastructures/gemini-provider';
import { CmsClient } from '../infrastructures/cms-client';

import type { AIProvider } from '../infrastructures/ai-provider.interface';

const infrastructurePlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting infrastructure plugin...');

    // 1. CMS Client Setup
    const cmsClient = new CmsClient(config.CMS_BASE_URL);
    fastify.decorate('cms', cmsClient);

    // 2. AI Providers Setup
    const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
    
    // Using the repository decorated from 'repositories' layer
    const systemSettingRepository = fastify.systemSettingRepository;
    
    const geminiKey = (await systemSettingRepository.get('GEMINI_API_KEY')) || '';
    const openaiKey = (await systemSettingRepository.get('OPENAI_API_KEY')) || '';

    const providers: Record<string, AIProvider> = {};

    for (const model of OPENAI_MODELS) {
        providers[`openai/${model}`] = new OpenAIProvider(
            openaiKey,
            config.OPENAI_API_URL,
            model,
            infraLogger
        );
    }

    for (const model of GEMINI_MODELS) {
        providers[`gemini/${model}`] = new GeminiProvider(
            geminiKey,
            config.GEMINI_API_URL,
            model,
            infraLogger,
            config.GEMINI_USE_CACHING
        );
    }

    fastify.decorate('aiProvider', providers);
};

export default fp(infrastructurePlugin, {
    name: 'infrastructure',
    dependencies: ['repositories']
});
