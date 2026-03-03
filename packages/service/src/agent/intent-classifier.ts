import type { AIProvider } from '../infrastructures/ai-provider.interface';
import { type AgentName } from '@cms/shared';
import { type AgentContext } from './chat-assistant';

export class IntentClassifier {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async resolve(userInput: string, context: AgentContext): Promise<AgentName | null> {
        const response = await this.aiProvider.generate(
            this.systemPrompt,
            '',
            userInput
        );

        if (response && typeof response === 'object') {
            const { agentName, taskType } = response;
            return (agentName as AgentName) || (taskType as AgentName) || null;
        }

        return null;
    }
}
