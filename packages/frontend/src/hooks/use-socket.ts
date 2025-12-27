import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type ChatMessage, type ServerToClientEvents, type ClientToServerEvents, type SchemaSummary } from '@cms/shared';
import { config } from '../config';

export function useSocket() {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        socketRef.current = io(config.API_BASE_URL, {
            withCredentials: true,
        });

        socketRef.current.on('connect', () => setIsConnected(true));
        socketRef.current.on('disconnect', () => setIsConnected(false));

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // usage of useCallback is necessary to prevent infinite loops in useEffect dependencies
    const sendMessage = useCallback((content: string, agentName?: string) => {
        socketRef.current?.emit(SOCKET_EVENTS.CHAT.SEND_MESSAGE, { content, agentName });
    }, []);

    const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.NEW_MESSAGE, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.NEW_MESSAGE, callback);
        };
    }, []);

    const onSchemaSummaryToConfirm = useCallback((callback: (data: SchemaSummary) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, callback);
        };
    }, []);

    const sendSchemaResponse = useCallback((data: SchemaSummary) => {
        socketRef.current?.emit(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE, data);
    }, []);

    return {
        isConnected,
        sendMessage,
        sendSchemaResponse,
        onNewMessage,
        onSchemaSummaryToConfirm,
    };
}
