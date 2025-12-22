import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type ChatMessage, type ServerToClientEvents, type ClientToServerEvents } from '@cms/shared';
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

    const sendMessage = (content: string) => {
        socketRef.current?.emit(SOCKET_EVENTS.CHAT.SEND_MESSAGE, { content });
    };

    const onNewMessage = (callback: (message: ChatMessage) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.NEW_MESSAGE, callback);
        return () => socketRef.current?.off(SOCKET_EVENTS.CHAT.NEW_MESSAGE, callback);
    };

    const onMessageSaved = (callback: (data: { success: boolean, message?: ChatMessage }) => void) => {
        socketRef.current?.on(SOCKET_EVENTS.CHAT.MESSAGE_SAVED, callback);
        return () => socketRef.current?.off(SOCKET_EVENTS.CHAT.MESSAGE_SAVED, callback);
    };

    return {
        isConnected,
        sendMessage,
        onNewMessage,
        onMessageSaved,
    };
}
