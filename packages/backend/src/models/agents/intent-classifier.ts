import type { AIProvider } from '../../infrastructures/ai-provider.interface';
import { type AgentName } from '@cms/shared';



export class IntentClassifier {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async resolve(userInput: string): Promise<AgentName | null> {
        try {
            const response = await this.aiProvider.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { agentName, taskType } = response;
                return (agentName || taskType) as AgentName;
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
