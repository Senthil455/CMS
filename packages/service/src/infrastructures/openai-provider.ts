import OpenAI from 'openai';
import type { AIProvider, AgentMessage } from './ai-provider.interface';
import type { ServiceLogger } from '../types/logger';

export class OpenAIProvider implements AIProvider {
    private openai: OpenAI;

    constructor(
        private apiKey: string,
        private readonly baseURL: string,
        private readonly model: string,
        private readonly logger: ServiceLogger
    ) {
        this.openai = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL
        });
    }

    setApiKey(key: string) {
        this.apiKey = key;
        this.openai = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL
        });
    }

    hasApiKey(): boolean {
        return !!this.apiKey;
    }

    getMaskedApiKey(): string | null {
        if (!this.apiKey) return null;
        if (this.apiKey.length <= 4) return '***';
        return `...${this.apiKey.slice(-4)}`;
    }

    async generate(system: string, developer: string, user: string, options?: { signal?: AbortSignal }): Promise<any> {
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
            }, options);

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
