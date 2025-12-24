import type { AIAgent } from '../../infrastructures/agent.interface';
import { type ChatOrchestrator } from './chat-orchestrator';

export class OrchestratorResolver {
    constructor(
        private readonly aiAgent: AIAgent,
        private readonly systemPrompt: string,
        private readonly orchestratorMap: Record<string, ChatOrchestrator>
    ) { }

    async resolve(userInput: string): Promise<ChatOrchestrator | null> {
        try {
            const response = await this.aiAgent.generate(this.systemPrompt, '', userInput);

            if (response && typeof response === 'object') {
                const { type } = response;
                const orchestrator = this.orchestratorMap[type];
                if (orchestrator) {
                    return orchestrator;
                }
            }

            return null;
        } catch (error) {
            console.error('Error resolving command:', error);
            return null;
        }
    }
}
