import { useCallback } from 'react';
import { SOCKET_EVENTS, type ChatMessage, type SystemMessagePayload } from '@cms/shared';
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



    const onSchemasSync = useCallback((callback: (data: SystemMessagePayload) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.SCHEMAS_SYNC, callback);
        };
    }, [socket]);


    const onAgentPlanToConfirm = useCallback((callback: (data: { agentName: string; data: any; agentTaskItem?: any }) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.AGENT_PLAN_TO_CONFIRM, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.AGENT_PLAN_TO_CONFIRM, callback);
        };
    }, [socket]);

    const sendAgentFeedbackResponse = useCallback((data: { agentName: string; feedbackData: any; selection?: any }) => {
        socket?.emit(SOCKET_EVENTS.CHAT.AGENT_FEEDBACK_RESPONSE, data);
    }, [socket]);

    const onAgentStatus = useCallback((callback: (data: { agentName: string | null, createdAt?: number }) => void) => {
        if (!socket) return () => { };
        socket.on(SOCKET_EVENTS.CHAT.AGENT_STATUS, callback);
        return () => {
            socket.off(SOCKET_EVENTS.CHAT.AGENT_STATUS, callback);
        };
    }, [socket]);

    return {
        isConnected,
        sendMessage,
        onMessageReceived,
        onAgentPlanToConfirm,
        sendAgentFeedbackResponse,
        onSchemasSync,
        onAgentStatus,
    };
}
