import type { FastifyPluginAsync } from 'fastify';
import { ENDPOINTS } from '@cms/shared';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const aiDataGeneratorRouter: FastifyPluginAsync = async (fastify) => {
    fastify.post(ENDPOINTS.AI.GENERATE_DATA, {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const payload = request.body as { entityName: string, requirement: string, existingData?: Record<string, any>, modelSelection?: string };
        const { entityName, requirement, existingData = {}, modelSelection } = payload;
        
        if (!entityName) {
            return reply.status(400).send({ success: false, error: 'entityName is required' });
        }

        try {
            // Get cms client and XEntity schema
            const cookieHeader = request.headers.cookie;
            const xEntity = await fastify.cms.getXEntity(cookieHeader || '', entityName);
            
            if (!xEntity) {
                return reply.status(404).send({ success: false, error: `Entity ${entityName} not found` });
            }

            // Pick AI provider: use modelSelection if valid, else fallback to first available
            const providerMap = fastify.aiProvider as Record<string, any>;
            const providers = Object.values(providerMap);
            if (providers.length === 0) {
                return reply.status(500).send({ success: false, error: 'No AI providers available' });
            }
            const aiProvider = (modelSelection && providerMap[modelSelection]) ? providerMap[modelSelection] : providers[0];

            // Load prompt
            const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
            const promptPath = path.join(__dirname, 'agent/single-item-generator.md');
            let systemPrompt = '';
            try {
                systemPrompt = await fs.readFile(promptPath, 'utf-8');
            } catch (err) {
                fastify.log.warn(`Prompt not found at ${promptPath}`);
                return reply.status(500).send({ success: false, error: 'System prompt missing' });
            }

            // Dev message
            const devMsg = `\nSCHEMA DEFINITION:\n${JSON.stringify([xEntity], null, 2)}`;
            
            // User message combining user requirement + existing data context
            const userMsgContent = [
                `User Requirement: ${requirement || 'Fill the form intelligently.'}`,
                `\nExisting Data Context:`,
                JSON.stringify(existingData, null, 2)
            ].join('\n');

            // Generate JSON 
            const responseData = await aiProvider.generate(
                systemPrompt,
                devMsg,
                userMsgContent,
                { parseJson: true }
            );

            return { success: true, data: responseData };
        } catch (error: any) {
            fastify.log.error({ err: error }, 'Failed to generate single item data');
            return reply.status(500).send({ success: false, error: error.message || 'AI Generation failed' });
        }
    });
};

export default aiDataGeneratorRouter;
