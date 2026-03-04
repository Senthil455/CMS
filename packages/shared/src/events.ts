import type { ChatMessage } from './contracts.js';
import { SchemaSummary, SystemRequirmentItem, SystemRequirment } from './app.dto.js';
import type { LayoutJson } from './app.dto.js';
import type { AgentName } from './constants.js';

export const SOCKET_EVENTS = {
    CHAT: {
        SEND_MESSAGE: 'chat:send_message',
        MESSAGE_RECEIVED: 'chat:message_received',
        SCHEMAS_SYNC: 'chat:schemas_sync',
        CONFIRM_AGENT_PLAN: 'chat:confirm_agent_plan',
        START_PAGE_PLAN: 'chat:start_page_plan',
        START_DATABASE_PLAN: 'chat:start_database_plan',
        START_WORKFLOW_PLAN: 'chat:start_workflow_plan',
        MODIFY_CURRENT_PAGE: 'chat:modify_current_page',
        // Unified feedback events
        AGENT_PLAN_TO_CONFIRM: 'chat:agent_plan_to_confirm',
        AGENT_FEEDBACK_RESPONSE: 'chat:agent_feedback_response',
        // Deprecated: kept for backward compatibility during frontend migration
        SCHEMA_SUMMARY_TO_CONFIRM: 'chat:schema_summary_to_confirm',
        SCHEMA_SUMMARY_RESPONSE: 'chat:schema_summary_response',
        TEMPLATE_SELECTION_LIST_TO_CONFIRM: 'chat:template_selection_list_to_confirm',
        TEMPLATE_SELECTION_DETAIL_TO_CONFIRM: 'chat:template_selection_detail_to_confirm',
        TEMPLATE_SELECTION_RESPONSE: 'chat:template_selection_response',
        SYSTEM_PLAN_TO_CONFIRM: 'chat:system_plan_to_confirm',
        SYSTEM_PLAN_RESPONSE: 'chat:system_plan_response',
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
    // Deprecated: kept for backward compatibility
    [SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM]: (summary: SchemaSummary) => void;
    [SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM]: (data: any) => void;
    [SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM]: (data: any) => void;
    [SOCKET_EVENTS.CHAT.SYSTEM_PLAN_TO_CONFIRM]: (data: SystemRequirment) => void;
    [SOCKET_EVENTS.CHAT.AGENT_STATUS]: (data: { agentName: string | null; createdAt?: number }) => void;
}

export interface ClientToServerEvents {
    [SOCKET_EVENTS.CHAT.SEND_MESSAGE]: (data: { content: string, providerName?: string }) => void;
    [SOCKET_EVENTS.CHAT.CONFIRM_AGENT_PLAN]: (data: { taskType: string; planItem: any }) => void;
    [SOCKET_EVENTS.CHAT.START_PAGE_PLAN]: (data: { userInput: string, currentRoute: string }) => void;
    [SOCKET_EVENTS.CHAT.START_DATABASE_PLAN]: (data: { userInput: string }) => void;
    [SOCKET_EVENTS.CHAT.START_WORKFLOW_PLAN]: (data: { userInput: string }) => void;
    [SOCKET_EVENTS.CHAT.MODIFY_CURRENT_PAGE]: (data: { requirement: string }) => void;
    // Unified feedback response
    [SOCKET_EVENTS.CHAT.AGENT_FEEDBACK_RESPONSE]: (data: { agentName: string; feedbackData: any; selection?: any }) => void;
    // Deprecated: kept for backward compatibility
    [SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE]: (data: SchemaSummary) => void;
    [SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_RESPONSE]: (data: any) => void;
    [SOCKET_EVENTS.CHAT.SYSTEM_PLAN_RESPONSE]: (data: SystemRequirment) => void;
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
