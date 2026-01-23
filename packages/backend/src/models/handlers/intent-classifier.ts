import type { AIProvider } from '../../infrastructures/agent.interface';
import { type HandlerType } from './chat-handler';



export class IntentClassifier {
    constructor(
        private readonly aiProvider: AIProvider,
        private readonly systemPrompt: string,
    ) { }

    async resolve(userInput: string): Promise<HandlerType | null> {
        try {
            const response = await this.aiProvider.generate(this.systemPrompt, '', userInput);

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
