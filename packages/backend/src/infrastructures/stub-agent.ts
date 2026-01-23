import type { AIProvider } from './agent.interface';

export class StubProvider implements AIProvider {
    async generate(system: string, developer: string, user: string): Promise<any> {
        try {
            return JSON.parse(user);
        } catch (error) {
            return JSON.parse(system);
        }
    }
}
