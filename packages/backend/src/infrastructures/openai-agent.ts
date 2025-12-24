import OpenAI from 'openai';
import type { AIAgent, AgentMessage } from './agent.interface';
import type { ServiceLogger } from '../types/logger';

export class OpenAIAgent implements AIAgent {
    private readonly openai: OpenAI;

    constructor(
        apiKey: string,
        baseURL: string,
        private readonly model: string,
        private readonly logger: ServiceLogger
    ) {
        this.openai = new OpenAI({
            apiKey,
            baseURL
        });
    }

    async generate(system: string, developer: string, user: string): Promise<any> {
        try {
            this.logger.info('OpenAIAgent generating from roles using SDK');

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'developer', content: developer } as any,
                    { role: 'user', content: user }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices?.[0]?.message?.content;
            if (content) {
                return JSON.parse(content);
            }

            return null;
        } catch (error: any) {
            this.logger.error({
                error: error.message,
                stack: error.stack
            }, 'OpenAI SDK Error');
            throw new Error('Failed to generate via OpenAI SDK');
        }
    }
}
