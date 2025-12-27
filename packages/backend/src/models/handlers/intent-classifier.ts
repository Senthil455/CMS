import type { AIAgent } from '../../infrastructures/agent.interface';
import { type ChatHandler, type HandlerType } from './chat-handler';

export class IntentClassifier {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly handlerMap: Record<HandlerType, ChatHandler>
    ) { }



    async resolve(userInput: string): Promise<ChatHandler | null> {
        try {


            const response = await this.aiAgent.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { type } = response;
                if (type === 'design' || type === 'list') {
                    const handler = this.handlerMap[type as HandlerType];
                    if (handler) {
                        return handler;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
