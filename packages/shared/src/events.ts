import type { ChatMessage } from './contracts.js';

export const SOCKET_EVENTS = {
    CHAT: {
        GET_HISTORY: 'chat:get_history',
        HISTORY_LOADED: 'chat:history_loaded',
        SEND_MESSAGE: 'chat:send_message',
        MESSAGE_SAVED: 'chat:message_saved',
        NEW_MESSAGE: 'chat:new_message',
    }
} as const;

export interface ServerToClientEvents {
    [SOCKET_EVENTS.CHAT.HISTORY_LOADED]: (history: ChatMessage[]) => void;
    [SOCKET_EVENTS.CHAT.MESSAGE_SAVED]: (data: { success: boolean; message?: ChatMessage; error?: string }) => void;
    [SOCKET_EVENTS.CHAT.NEW_MESSAGE]: (message: ChatMessage) => void;
}

export interface ClientToServerEvents {
    [SOCKET_EVENTS.CHAT.GET_HISTORY]: () => void;
    [SOCKET_EVENTS.CHAT.SEND_MESSAGE]: (data: { content: string }) => void;
}

