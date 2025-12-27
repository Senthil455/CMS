import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config';


import { StubAgent } from '../infrastructures/stub-agent';
import { OpenAIAgent } from '../infrastructures/openai-agent';
import { GLMAgent } from '../infrastructures/glm-agent';
import { GeminiAgent } from '../infrastructures/gemini-agent';

import type { AIAgent } from '../infrastructures/agent.interface';

const aiAgentPlugin: FastifyPluginAsync = async (fastify) => {
    const infraLogger = fastify.log.child({ component: 'INFRA' }, { level: config.LOG_LEVEL_INFRASTRUCTURE });

    const agents: Record<string, AIAgent> = {
        stub: new StubAgent(),
        openai: new OpenAIAgent(
            config.OPENAI_API_KEY || '',
            config.OPENAI_API_URL,
            config.OPENAI_MODEL,
            infraLogger
        ),
        glm: new GLMAgent(
            config.GLM_API_URL,
            config.GLM_MODEL,
            infraLogger
        ),

        gemini: new GeminiAgent(
            config.GEMINI_API_KEY || '',
            config.GEMINI_API_URL,
            config.GEMINI_MODEL,
            infraLogger,
            config.GEMINI_USE_CACHING
        )
    };

    fastify.decorate('aiAgent', agents);
};

export default fp(aiAgentPlugin, {
    name: 'aiAgent'
});
