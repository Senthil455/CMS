import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';

const aiRouter: FastifyPluginAsync = async (fastify) => {
    fastify.get(ENDPOINTS.AI.PROVIDERS, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const agents = Object.keys(fastify.aiProvider);
        const combinations: string[] = [];

        if (agents.includes('gemini')) {
            combinations.push('gemini (gemini-1.5-pro)');
            combinations.push('gemini (gemini-1.5-flash)');
            combinations.push('gemini (gemini-2.0-pro-exp-02-05)');
            combinations.push('gemini (gemini-2.0-flash)');
        }

        if (agents.includes('openai')) {
            combinations.push('openai (gpt-5.2)');
            combinations.push('openai (gpt-5-mini)');
            combinations.push('openai (gpt-5-nano)');
        }

        return { success: true, data: combinations };
    });
};

export default aiRouter;
