import type { AgentTaskItem } from '../models/agent-task-model';

export interface AgentContext {
    externalCookie: string;
    schemaId?: string;
    saveAgentMessage: (content: string) => Promise<void>;
    signal?: AbortSignal;
    metadata?: Record<string, unknown>;
}


export interface ThinkResult<T> {
    plan: T;
    prompts: {
        systemPrompt: string;
        developerMessage: string;
        userInput: string;
    };
}

export interface ActResult<T> {
    feedback: T | null;
    syncedSchemaIds: string[];
    followingTaskItems?: Omit<AgentTaskItem, 'index'>[];
}

export interface FinalizeResult {
    syncedSchemaIds: string[];
    followingTaskItems?: Omit<AgentTaskItem, 'index'>[];
}

export interface Agent<T = any> {
    think(userInput: string, context: AgentContext): Promise<ThinkResult<T>>;
    /**
     * Execute the plan. Return feedback data if user confirmation is needed,
     * or null feedback if the pipeline can continue. Include any modified schema IDs.
     */
    act(plan: T, context: AgentContext): Promise<ActResult<T>>;
    /**
     * Called by the orchestrator after the user confirms the feedback.
     * Move post-confirmation logic here (e.g. commit entities, save pages, create tasks).
     * Return any modified schema IDs.
     */
    finalize(feedbackData: any, context: AgentContext): Promise<FinalizeResult>;
}
