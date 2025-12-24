import type { AIAgent } from './agent.interface';
import type { ServiceLogger } from '../types/logger';

export class GLMAgent implements AIAgent {
    constructor(
        private readonly baseURL: string,
        private readonly model: string,
        private readonly logger: ServiceLogger
    ) {
    }

    async generate(system: string, developer: string, user: string): Promise<any> {
        const start = Date.now();

        try {
            const messages = [
                { role: 'system', content: system },
                { role: 'developer', content: developer },
                { role: 'user', content: user }
            ];
            const resp = await fetch(`${this.baseURL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    temperature: 0,
                    stream: false,
                    messages
                })
            });


            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`HTTP ${resp.status}: ${text}`);
            }

            const data = await resp.json();

            // Reassemble streamed content if necessary
            let content = '';
            if (data.message?.content) {
                content = data.message.content;
            }

            // Try parsing JSON first
            try {
                let jsonString = content;
                const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    jsonString = jsonMatch[1] ?? '';
                }
                // Strip single-line comments (// ...)
                jsonString = jsonString.replace(/\/\/.*/g, '');
                const json = JSON.parse(jsonString.trim());
                return json;
            } catch {
                this.logger.warn({
                    model: this.model,
                    content
                }, 'GLM response is not valid JSON');
                return content;
            }

        } catch (error: any) {
            this.logger.error({
                model: this.model,
                durationMs: Date.now() - start,
                error: error?.message ?? error
            }, 'GLM generate failed');
            throw error;
        }
    }
}
