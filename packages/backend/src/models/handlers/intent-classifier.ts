import type { AIAgent } from '../../infrastructures/agent.interface';
import { type HandlerType } from './chat-handler';



export class IntentClassifier {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
    ) { }

    async resolve(userInput: string): Promise<HandlerType | null> {
        try {
            const response = await this.aiAgent.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { taskType } = response;
                return taskType as HandlerType;
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
