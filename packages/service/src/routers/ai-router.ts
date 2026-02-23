import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const aiRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.PROVIDERS, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const agents = Object.keys(fastify.aiProvider);
        const combinations: string[] = [];

        if (agents.includes('gemini') && fastify.aiProvider['gemini']?.hasApiKey && fastify.aiProvider['gemini']?.hasApiKey()) {
            combinations.push('gemini (gemini-3-pro)');
            combinations.push('gemini (gemini-3-flash)');
            combinations.push('gemini (gemini-2.5-flash)');
        }

        if (agents.includes('openai') && fastify.aiProvider['openai']?.hasApiKey && fastify.aiProvider['openai']?.hasApiKey()) {
            combinations.push('openai (gpt-5.2)');
            combinations.push('openai (gpt-5-mini)');
            combinations.push('openai (gpt-5-nano)');
        }

        return { success: true, data: combinations };
    });
};

export default aiRouter;
