import type { AIProvider } from './agent.interface';
import type { ServiceLogger } from '../types/logger';

export class GeminiProvider implements AIProvider {
    private cacheNames = new Map<string, string>();

    constructor(
        private readonly apiKey: string,
        private readonly baseURL: string,
        private readonly model: string,
        private readonly logger: ServiceLogger,
        private readonly useCaching: boolean = false
    ) {
    }

    private async getOrCreateCache(system: string, developer: string): Promise<string | null> {
        const cacheKey = `${system}\n\n${developer}`;
        if (this.cacheNames.has(cacheKey)) {
            return this.cacheNames.get(cacheKey)!;
        }

        try {
            this.logger.info('Creating new Gemini context cache...');
            const endpoint = `${this.baseURL}/v1beta/cachedContents?key=${this.apiKey}`;
            const body = {
                model: `models/${this.model}`,
                system_instruction: {
                    parts: [{ text: cacheKey }]
                },
                ttl: "3600s" // 1 hour TTL
            };

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const text = await resp.text();
                // If cache creation fails (e.g. too many caches), we fall back to normal generation
                this.logger.warn({ status: resp.status, text }, 'Failed to create Gemini context cache, falling back to non-cached');
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
            this.logger.error({ error }, 'Error creating Gemini context cache');
        }
        return null;
    }

    async generate(system: string, developer: string, user: string): Promise<any> {
        const start = Date.now();

        try {
            let cacheName: string | null = null;
            if (this.useCaching) {
                cacheName = await this.getOrCreateCache(system, developer);
            }

            const endpoint = `${this.baseURL}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

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

            this.logger.debug({ model: this.model, cached: !!cacheName }, 'GeminiProvider generating content');

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Gemini API error ${resp.status}: ${text}`);
            }

            const data = await resp.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                this.logger.warn({ data }, 'Gemini returned empty content');
                return null;
            }

            try {
                return JSON.parse(content);
            } catch (e) {
                this.logger.error({ content, error: e }, 'Failed to parse Gemini JSON response');
                // Return raw content as fallback if it's supposed to be JSON but fails
                return content;
            }

        } catch (error: any) {
            this.logger.error({
                model: this.model,
                durationMs: Date.now() - start,
                error: error?.message ?? error
            }, 'Gemini generate failed');
            throw error;
        }
    }
}
