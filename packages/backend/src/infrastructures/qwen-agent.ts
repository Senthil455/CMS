import axios from 'axios';
import type { IAgent, GenerateOptions } from '../models/agent.interface';
import type { ServiceLogger } from '../types/logger';

export class QwenAgent implements IAgent {
    constructor(
        private readonly apiKey: string,
        private readonly apiUrl: string,
        private readonly model: string,
        private readonly logger: ServiceLogger
    ) { }

    async generate(options: GenerateOptions): Promise<any[]> {
        const { requirements, prompt: promptTemplate, schemas } = options;
        try {
            this.logger.info({ requirements }, 'QwenAgent generating entities from requirements');

            // 1. Construct final prompt using provided prompt and schemas
            const schemasText = schemas.map(s => `${s.name.toUpperCase()} SCHEMA:\n${s.content}`).join('\n\n');

            const prompt = promptTemplate
                .replace('<schemas here>', schemasText)
                .replace('<requirements here>', requirements);

            console.log('QwenAgent generating entities from requirements\n', prompt);

            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    prompt,
                    format: "json",
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            console.log('QwenAgent response\n', response.data.response);
            const parsed = JSON.parse(response.data.response);

            // The prompt asks for { "entities": [ ... ] }
            if (parsed.entities && Array.isArray(parsed.entities)) {
                return parsed.entities;
            }

            return [];
        } catch (error: any) {
            this.logger.error({
                error: error.message,
                response: error.response?.data
            }, 'Qwen API Error');
            throw new Error('Failed to generate entities via Qwen');
        }
    }
}
