import type { AIProvider } from '../infrastructures/ai-provider.interface';
import { type AgentName } from '@cms/shared';
import { parseModelFromProvider } from './chat-assistant';

export class IntentClassifier {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async resolve(userInput: string, providerName?: string): Promise<AgentName | null> {
        const modelName = providerName ? parseModelFromProvider(providerName) : undefined;
        const response = await this.aiProvider.generate(this.systemPrompt, '', userInput, modelName);

        if (response && typeof response === 'object') {
            const { agentName, taskType } = response;
            return (agentName || taskType) as AgentName;
        }

        return null;
    }
}
