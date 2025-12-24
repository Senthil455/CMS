export interface AgentMessage {
    role: 'user' | 'developer' | 'system';
    content: string;
}

export interface AIAgent {
    generate(system: string, developer: string, user: string): Promise<any>;
}
