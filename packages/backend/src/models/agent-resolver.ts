import type { IAgent } from '../infrastructures/agent.interface';
import { type ChatAgent } from './chat-agent';

export class AgentResolver {
    constructor(
        private readonly agent: IAgent,
        private readonly systemPrompt: string,
        private readonly agentMap: Record<string, ChatAgent>
    ) { }

    async resolve(userInput: string): Promise<ChatAgent | null> {
        try {
            const response = await this.agent.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { type } = response;
                const chatAgent = this.agentMap[type];
                if (chatAgent) {
                    return chatAgent;
                }
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
