import type { AIAgent, AgentMessage } from './agent.interface';

export class StubAgent implements AIAgent {
    async generate(system: string, developer: string, user: string): Promise<any> {
        try {
            return JSON.parse(user);
        } catch (error) {
            return JSON.parse(system);
        }
    }
}
