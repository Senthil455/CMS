import type { AIAgent } from '../../infrastructures/agent.interface';
import { type ChatHandler, type HandlerType } from './chat-handler';

export interface IntentClassifierResponse {
    handler: ChatHandler;
    taskType: HandlerType;
}

export class IntentClassifier {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly handlerMap: Record<HandlerType, ChatHandler>
    ) { }



    async resolve(userInput: string): Promise<IntentClassifierResponse | null> {
        try {
            const response = await this.aiAgent.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { taskType } = response;
                if (this.handlerMap[taskType as HandlerType]) {
                    return { handler: this.handlerMap[taskType as HandlerType], taskType };
                }
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
