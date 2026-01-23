import type { AIProvider } from '../../infrastructures/agent.interface';
import { type AgentTrigger } from '@cms/shared';



export class IntentClassifier {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async resolve(userInput: string): Promise<AgentTrigger | null> {
        try {
            const response = await this.aiProvider.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { taskType } = response;
                return taskType as AgentTrigger;
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
