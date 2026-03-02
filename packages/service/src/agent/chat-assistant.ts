import type { ChatMessage, AgentName, AgentTaskRef, OnServerToClientEvent, ModelSelection } from '@cms/shared';

export interface AgentContext {
    agentTaskItem?: AgentTaskRef | undefined;
    userId: string;
    externalCookie: string;
    agentName: AgentName;
    selection: ModelSelection;
    schemaId?: string;
    saveAgentMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    emitEvent: OnServerToClientEvent;
    signal?: AbortSignal;
}

/**
 * Payload composed by ChatService when an agent's act() returns non-null.
 * Sent to the frontend via AGENT_PLAN_TO_CONFIRM so the user can review & confirm.
 */
export interface AgentFeedbackPayload<T = any> {
    agentName: AgentName;
    data: T;
    agentTaskItem?: AgentTaskRef;
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
    /**
     * Execute the plan. Return domain data if user feedback is needed before finalizing,
     * or null if no feedback is needed and the pipeline can continue.
     */
    act(plan: T, context: AgentContext): Promise<T | null>;
    /**
     * Called by the orchestrator after the user confirms the feedback.
     * Move post-confirmation logic here (e.g. commit entities, save pages, create tasks).
     * Agents that don't need feedback can provide a no-op.
     */
    finalize(feedbackData: any, context: AgentContext): Promise<void>;
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