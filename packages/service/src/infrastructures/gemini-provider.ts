import type { AIProvider } from './ai-provider.interface';
import type { ServiceLogger } from '../types/logger';
import { AgentProviderError } from './agent-provider-error';

export class GeminiProvider implements AIProvider {
    private cacheNames = new Map<string, string>();

    constructor(
        private apiKey: string,
        private readonly baseURL: string,
        private readonly model: string,
        private readonly logger: ServiceLogger,
        private readonly useCaching: boolean = false
    ) {
    }

    setApiKey(key: string) {
        this.apiKey = key;
    }

    hasApiKey(): boolean {
        return !!this.apiKey;
    }

    getMaskedApiKey(): string | null {
        if (!this.apiKey) return null;
        if (this.apiKey.length <= 4) return '***';
        return `...${this.apiKey.slice(-2)}`;
    }

    private async getOrCreateCache(system: string, developer: string, currentModel: string, options?: { signal?: AbortSignal }): Promise<string | null> {
        const cacheKey = `${currentModel}\n${system}\n\n${developer}`;
        if (this.cacheNames.has(cacheKey)) {
            return this.cacheNames.get(cacheKey)!;
        }

        try {
            this.logger.info('Creating new Gemini context cache...');
            const endpoint = `${this.baseURL}/v1beta/cachedContents?key=${this.apiKey}`;
            const body = {
                model: `models/${currentModel}`,
                system_instruction: {
                    parts: [{ text: cacheKey }]
                },
                ttl: "3600s" // 1 hour TTL
            };

            const fetchOptions: any = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            };
            if (options?.signal) {
                fetchOptions.signal = options.signal;
            }
            const resp = await fetch(endpoint, fetchOptions);

            if (!resp.ok) {
                const text = await resp.text();
                // If cache creation fails (e.g. too many caches), we fall back to normal generation
                return null;
            }

            const data = await resp.json();
            const cacheName = data.name;
            if (cacheName) {
                this.cacheNames.set(cacheKey, cacheName);
                this.logger.info({ cacheName }, 'Gemini context cache created successfully');
                return cacheName;
            }
        } catch (error) {
        }
        return null;
    }

    async generate(system: string, developer: string, user: string, options?: { signal?: AbortSignal }): Promise<any> {
        const start = Date.now();
        let currentModel = this.model;
        if (['gemini-3-pro', 'gemini-3-flash', 'gemini-3.1-pro'].includes(currentModel)) {
            currentModel = `${currentModel}-preview`;
        }

        try {
            let cacheName: string | null = null;
            if (this.useCaching) {
                cacheName = await this.getOrCreateCache(system, developer, currentModel, options);
            }

            const endpoint = `${this.baseURL}/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`;

            const body: any = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: user }]
                    }
                ],
                generationConfig: {
                    temperature: 0,
                    responseMimeType: "application/json"
                }
            };

            if (cacheName) {
                body.cachedContent = cacheName;
            } else {
                body.system_instruction = {
                    parts: [{ text: `${system}\n\n${developer}` }]
                };
            }

            this.logger.debug({ model: currentModel, cached: !!cacheName }, 'GeminiProvider generating content');

            const fetchOptions: any = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            };
            if (options?.signal) {
                fetchOptions.signal = options.signal;
            }
            const resp = await fetch(endpoint, fetchOptions);

            if (!resp.ok) {
                const text = await resp.text();
                let shortMsg = `Gemini API error ${resp.status}`;
                try {
                    const errObj = JSON.parse(text);
                    const msg = errObj?.error?.message?.split('\n')[0] || '';
                    const retryDetail = errObj?.error?.details?.find((d: any) => d.retryDelay);
                    const retryDelay = retryDetail?.retryDelay || '';
                    shortMsg = `Gemini ${resp.status}: ${msg}${retryDelay ? ` (retry in ${retryDelay})` : ''}`;
                } catch { /* use shortMsg as-is */ }
                throw new Error(shortMsg);
            }

            const data = await resp.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                return null;
            }

            try {
                return JSON.parse(content);
            } catch (e) {
                // Return raw content as fallback if it's supposed to be JSON but fails
                return content;
            }

        } catch (error: any) {
            // This might throw AgentProviderError
            this.transformError(error);

            throw error;
        }
    }
    transformError(error: any): string {
        let errorMessage = error.message || 'Unknown error occurred';

        if (errorMessage.includes('Gemini API error 429')) {
            try {
                const jsonPart = errorMessage.substring(errorMessage.indexOf('{'));
                const errorObj = JSON.parse(jsonPart);
                if (errorObj?.error?.message) {
                    errorMessage = errorObj.error.message;
                }
            } catch (e) {
                // If parsing fails, just use the original message or a cleaner fallback
                errorMessage = 'You exceeded your current AI quota. Please wait a few seconds and try again.';
            }
            throw new AgentProviderError(errorMessage);
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        return errorMessage;
    }
}
