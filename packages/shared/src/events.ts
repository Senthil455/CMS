import type { ChatMessage } from './contracts.js';
import type { AgentName } from './constants.js';

export const SOCKET_EVENTS = {
    CHAT: {
        SEND_MESSAGE: 'chat:send_message',
        MESSAGE_RECEIVED: 'chat:message_received',
        SCHEMAS_SYNC: 'chat:schemas_sync',
        // Unified feedback events
        AGENT_PLAN_TO_CONFIRM: 'chat:agent_plan_to_confirm',
        AGENT_FEEDBACK_RESPONSE: 'chat:agent_feedback_response',
        AGENT_STATUS: 'chat:agent_status',
    }
} as const;

export interface SystemMessagePayload {
    task_type: AgentName;
    schemasId: string[];
}

export interface ServerToClientEvents {
    [SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED]: (message: ChatMessage) => void;
    [SOCKET_EVENTS.CHAT.SCHEMAS_SYNC]: (data: SystemMessagePayload) => void;
    // Unified feedback event
    [SOCKET_EVENTS.CHAT.AGENT_PLAN_TO_CONFIRM]: (data: { agentName: AgentName; data: any; agentTaskItem?: any }) => void;
    [SOCKET_EVENTS.CHAT.AGENT_STATUS]: (data: { agentName: string | null; createdAt?: number }) => void;
}

export interface ClientToServerEvents {
    [SOCKET_EVENTS.CHAT.SEND_MESSAGE]: (data: { content: string, providerName?: string }) => void;
    // Unified feedback response
    [SOCKET_EVENTS.CHAT.AGENT_FEEDBACK_RESPONSE]: (data: { agentName: string; feedbackData: any; selection?: any }) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    user: {
        id: number;
        username: string;
        email: string;
    };
    externalCookie: string;
}

export type OnServerToClientEvent = <K extends keyof ServerToClientEvents>(event: K, ...args: Parameters<ServerToClientEvents[K]>) => void;
