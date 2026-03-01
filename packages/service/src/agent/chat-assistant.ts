import type { ChatMessage, AgentName, AgentTaskRef, OnServerToClientEvent, ModelSelection } from '@cms/shared';

export interface AgentContext {
    agentTaskItem?: AgentTaskRef | undefined;
    userId: string;
    externalCookie: string;
    agentName: AgentName;
    selection: ModelSelection;
    schemaId?: string;
    saveAgentMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    updateStatus: (content: string) => Promise<void>;
    emitEvent: OnServerToClientEvent;
    signal?: AbortSignal;
}

export interface AgentHandleResponse {
    needUserFeedback: boolean;
}

export interface AgentPlanResponse<T> {
    plan: T;
    prompts: {
        systemPrompt: string;
        developerMessage: string;
        userInput: string;
    };
}

export interface Agent<T = any> {
    think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<T>>;
    act(plan: T, context: AgentContext): Promise<boolean>;
}

/**
 * Throw this from think() to stop the agent pipeline and send a user-facing message.
 * The orchestrator catches it, sends the message via websocket, and skips act().
 */
export class AgentStopError extends Error {
    constructor(public readonly userMessage: string) {
        super(userMessage);
        this.name = 'AgentStopError';
    }
}