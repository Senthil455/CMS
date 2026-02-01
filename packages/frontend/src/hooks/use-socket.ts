import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type ChatMessage, type ServerToClientEvents, type ClientToServerEvents, type SchemaSummary, type SystemMessagePayload } from '@cms/shared';
import { config } from '../config';

export function useSocket() {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        socketRef.current = io(config.API_BASE_URL, {
            path: '/cmsapi/socket.io',
            withCredentials: true,
        });

        socketRef.current.on('connect', () => setIsConnected(true));
        socketRef.current.on('disconnect', () => setIsConnected(false));

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // usage of useCallback is necessary to prevent infinite loops in useEffect dependencies
    const sendMessage = useCallback((content: string, providerName?: string) => {
        socketRef.current?.emit(SOCKET_EVENTS.CHAT.SEND_MESSAGE, { content, providerName });
    }, []);

    const onMessageReceived = useCallback((callback: (message: ChatMessage) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, callback);
        };
    }, []);

    const onSchemaSummaryToConfirm = useCallback((callback: (data: SchemaSummary) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, callback);
        };
    }, []);

    const onSchemasSync = useCallback((callback: (data: SystemMessagePayload) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, callback);
        };
    }, []);

    const sendSchemaResponse = useCallback((data: SchemaSummary) => {
        socketRef.current?.emit(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE, data);
    }, []);

    const onTemplateSelectionListToConfirm = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, callback);
        };
    }, []);

    const onTemplateSelectionDetailToConfirm = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, callback);
        return () => {
            socketRef.current?.off(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, callback);
        };
    }, []);

    const sendTemplateSelectionResponse = useCallback((data: any) => {
        socketRef.current?.emit(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_RESPONSE, data);
    }, []);

    return {
        isConnected,
        sendMessage,
        sendSchemaResponse,
        sendTemplateSelectionResponse,
        onMessageReceived,
        onSchemaSummaryToConfirm,
        onTemplateSelectionListToConfirm,
        onTemplateSelectionDetailToConfirm,
        onSchemasSync,
    };
}
