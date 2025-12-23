import axios from 'axios';
import type { IAgent, AgentMessage } from './agent.interface';
import type { ServiceLogger } from '../types/logger';

export class QwenAgent implements IAgent {
    constructor(
        private readonly apiKey: string,
        private readonly apiUrl: string,
        private readonly model: string,
        private readonly logger: ServiceLogger
    ) { }

    async generate(system: string, developer: string, user: string): Promise<any> {
        try {
            this.logger.info('QwenAgent generating from merged prompt');

            // Merge parameters into a single string prompt
            const prompt = system.replace('<developer>', developer).replace('<user>', user);

            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    prompt: prompt,
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

            if (response.data?.response) {
                return JSON.parse(response.data.response);
            }

            if (response.data?.choices?.[0]?.message?.content) {
                return JSON.parse(response.data.choices[0].message.content);
            }

            return null;
        } catch (error: any) {
            this.logger.error({
                error: error.message,
                response: error.response?.data
            }, 'Qwen API Error');
            throw new Error('Failed to generate via Qwen');
        }
    }
}
