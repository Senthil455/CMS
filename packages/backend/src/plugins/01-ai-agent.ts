import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config';


import { StubProvider } from '../infrastructures/stub-agent';
import { OpenAIProvider } from '../infrastructures/openai-agent';
import { GeminiProvider } from '../infrastructures/gemini-agent';

import type { AIProvider } from '../infrastructures/agent.interface';

const aiAgentPlugin: FastifyPluginAsync = async (fastify) => {
    const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });

    const providers: Record<string, AIProvider> = {
        stub: new StubProvider(),
        openai: new OpenAIProvider(
            config.OPENAI_API_KEY || '',
            config.OPENAI_API_URL,
            config.OPENAI_MODEL,
            infraLogger
        ),

        gemini: new GeminiProvider(
            config.GEMINI_API_KEY || '',
            config.GEMINI_API_URL,
            config.GEMINI_MODEL,
            infraLogger,
            config.GEMINI_USE_CACHING
        )
    };

    fastify.decorate('aiProvider', providers);
};

export default fp(aiAgentPlugin, {
    name: 'aiProvider'
});
