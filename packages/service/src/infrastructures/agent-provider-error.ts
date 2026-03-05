export class AgentProviderError extends Error {
    constructor(message: string, public override readonly cause?: any) {
        super(message);
        this.name = 'AgentProviderError';
    }
}
