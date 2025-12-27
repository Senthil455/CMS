import type { ChatMessage } from './contracts.js';
import { SchemaSummary } from './dtos.js';

export const SOCKET_EVENTS = {
    CHAT: {
        SEND_MESSAGE: 'chat:send_message',
        NEW_MESSAGE: 'chat:new_message',
        SCHEMA_SUMMARY_TO_CONFIRM: 'chat:schema_summary_to_confirm',
        SCHEMA_SUMMARY_RESPONSE: 'chat:schema_summary_response',
    }
} as const;

export interface ServerToClientEvents {
    [SOCKET_EVENTS.CHAT.NEW_MESSAGE]: (message: ChatMessage) => void;
    [SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM]: (summary: SchemaSummary) => void;
}

export interface ClientToServerEvents {
    [SOCKET_EVENTS.CHAT.SEND_MESSAGE]: (data: { content: string, agentName?: string }) => void;
    [SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE]: (data: SchemaSummary) => void;
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
