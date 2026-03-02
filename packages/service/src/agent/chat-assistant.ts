import type { ChatMessage, AgentName, AgentTaskRef, ModelSelection } from '@cms/shared';

export interface AgentContext {
    agentTaskItem?: AgentTaskRef | undefined;
    externalCookie: string;
    agentName: AgentName;
    selection: ModelSelection;
    schemaId?: string;
    saveAgentMessage: (content: string, payload?: any) => Promise<ChatMessage>;
    signal?: AbortSignal;
}

/**
 * Payload composed by ChatService when an agent's act() returns non-null feedback.
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

export interface AgentActResult<T> {
    feedback: T | null;
    syncedSchemaIds: string[];
}

export interface AgentFinalizeResult {
    syncedSchemaIds: string[];
}

export interface Agent<T = any> {
    think(userInput: string, context: AgentContext): Promise<AgentPlanResponse<T>>;
    /**
     * Execute the plan. Return feedback data if user confirmation is needed,
     * or null feedback if the pipeline can continue. Include any modified schema IDs.
     */
    act(plan: T, context: AgentContext): Promise<AgentActResult<T>>;
    /**
     * Called by the orchestrator after the user confirms the feedback.
     * Move post-confirmation logic here (e.g. commit entities, save pages, create tasks).
     * Return any modified schema IDs.
     */
    finalize(feedbackData: any, context: AgentContext): Promise<AgentFinalizeResult>;
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