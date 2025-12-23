import type { IAgent } from '../infrastructures/agent.interface';
import { type ChatAgent } from './chat-agent';

export class CommandResolver {
    constructor(
        private readonly agent: IAgent,
        private readonly systemPrompt: string,
        private readonly agentMap: Record<string, ChatAgent>
    ) { }

    async resolve(userInput: string): Promise<{ agent: ChatAgent, entityName: string } | null> {
        try {
            const response = await this.agent.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { type, entityName } = response;
                const chatAgent = this.agentMap[type];
                if (chatAgent) {
                    return { agent: chatAgent, entityName: entityName || '' };
                }
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
