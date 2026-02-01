import OpenAI from 'openai';
import type { AIProvider, AgentMessage } from './ai-provider.interface';
import type { ServiceLogger } from '../types/logger';

export class OpenAIProvider implements AIProvider {
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
            this.logger.info('OpenAIProvider generating from roles using SDK');

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
    transformError(error: any): string {
        let errorMessage = error.message || 'Unknown error occurred';
        if (error.response?.data?.error?.message) {
            errorMessage = error.response.data.error.message;
        }
        return errorMessage;
    }
}
