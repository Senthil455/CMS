import type { AgentContext } from '../agents/chat-agent';

export interface Planner<T> {
    plan(userInput: string, context: AgentContext, ...args: any[]): Promise<T>;
}
