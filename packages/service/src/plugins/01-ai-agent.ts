import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config';


import { OpenAIProvider } from '../infrastructures/openai-provider';
import { GeminiProvider } from '../infrastructures/gemini-provider';

import type { AIProvider } from '../infrastructures/ai-provider.interface';

const aiAgentPlugin: FastifyPluginAsync = async (fastify) => {
    const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });

    const geminiKeySetting = await fastify.prisma.systemSetting.findUnique({
        where: { key: 'GEMINI_API_KEY' }
    });
    const geminiKey = geminiKeySetting?.value || config.GEMINI_API_KEY || '';

    const providers: Record<string, AIProvider> = {
        openai: new OpenAIProvider(
            config.OPENAI_API_KEY || '',
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
