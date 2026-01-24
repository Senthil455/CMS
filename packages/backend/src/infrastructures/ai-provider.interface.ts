export interface AgentMessage {
    role: 'user' | 'developer' | 'system';
    content: string;
}

export interface AIProvider {
    generate(system: string, developer: string, user: string): Promise<any>;
    transformError(error: any): string;
}
