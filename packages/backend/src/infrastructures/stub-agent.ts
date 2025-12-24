import type { AIAgent, AgentMessage } from './agent.interface';

export class StubAgent implements AIAgent {
    async generate(system: string, developer: string, user: string): Promise<any> {
        console.log('StubAgent.generate called with roles');
        return JSON.parse(system);
    }
}
