import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config';


import { OpenAIProvider } from '../infrastructures/openai-provider';
import { GeminiProvider } from '../infrastructures/gemini-provider';
import { SqliteSystemSettingRepository } from '../repositories/system-setting-repository';

import type { AIProvider } from '../infrastructures/ai-provider.interface';

const aiAgentPlugin: FastifyPluginAsync = async (fastify) => {
    const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });
    const systemSettingRepository = new SqliteSystemSettingRepository(fastify.prisma);

    const geminiKey = (await systemSettingRepository.get('GEMINI_API_KEY')) || config.GEMINI_API_KEY || '';
    const openaiKey = (await systemSettingRepository.get('OPENAI_API_KEY')) || config.OPENAI_API_KEY || '';

    const providers: Record<string, AIProvider> = {
        openai: new OpenAIProvider(
            openaiKey,
            config.OPENAI_API_URL,
            config.OPENAI_MODEL,
            infraLogger
        ),

        gemini: new GeminiProvider(
            geminiKey,
            config.GEMINI_API_URL,
            config.GEMINI_MODEL,
            infraLogger,
            config.GEMINI_USE_CACHING
        )
    };

    fastify.decorate('aiProvider', providers);
};

export default fp(aiAgentPlugin, {
    name: 'aiProvider',
    dependencies: ['prisma']
});
