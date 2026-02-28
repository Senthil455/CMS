import { useCallback } from 'react';
import { SOCKET_EVENTS, type ChatMessage, type SchemaSummary, type SystemMessagePayload } from '@cms/shared';
import { useSocketContext } from '../context/socket-provider';

export function useSocket() {
    const { socket, isConnected } = useSocketContext();

    // usage of useCallback is necessary to prevent infinite loops in useEffect dependencies
    const sendMessage = useCallback((content: string, providerName?: string) => {
        socket?.emit(SOCKET_EVENTS.CHAT.SEND_MESSAGE, { content, providerName });
    }, [socket]);

    const onMessageReceived = useCallback((callback: (message: ChatMessage) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED, callback);
        };
    }, [socket]);

    const onSchemaSummaryToConfirm = useCallback((callback: (data: SchemaSummary) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_TO_CONFIRM, callback);
        };
    }, [socket]);

    const onSchemasSync = useCallback((callback: (data: SystemMessagePayload) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, callback);
        };
    }, [socket]);

    const sendSchemaResponse = useCallback((data: SchemaSummary) => {
        socket?.emit(SOCKET_EVENTS.CHAT.SCHEMA_SUMMARY_RESPONSE, data);
    }, [socket]);

    const onTemplateSelectionListToConfirm = useCallback((callback: (data: any) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_LIST_TO_CONFIRM, callback);
        };
    }, [socket]);

    const onTemplateSelectionDetailToConfirm = useCallback((callback: (data: any) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_DETAIL_TO_CONFIRM, callback);
        };
    }, [socket]);

    const onSystemPlanToConfirm = useCallback((callback: (data: any[]) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.SYSTEM_PLAN_TO_CONFIRM, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.SYSTEM_PLAN_TO_CONFIRM, callback);
        };
    }, [socket]);

    const sendTemplateSelectionResponse = useCallback((data: any) => {
        socket?.emit(SOCKET_EVENTS.CHAT.TEMPLATE_SELECTION_RESPONSE, data);
    }, [socket]);

    const sendSystemPlanResponse = useCallback((data: any[]) => {
        socket?.emit(SOCKET_EVENTS.CHAT.SYSTEM_PLAN_RESPONSE, data);
    }, [socket]);

    return {
        isConnected,
        sendMessage,
        sendSchemaResponse,
        sendTemplateSelectionResponse,
        sendSystemPlanResponse,
        onMessageReceived,
        onSchemaSummaryToConfirm,
        onTemplateSelectionListToConfirm,
        onTemplateSelectionDetailToConfirm,
        onSystemPlanToConfirm,
        onSchemasSync,
    };
}
