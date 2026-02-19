import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { type ServerToClientEvents, type ClientToServerEvents } from '@cms/shared';

interface SocketContextType {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    isConnected: boolean;
    hasConnectedOnce: boolean;
    connectError: string | null;
    refreshConnection: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    hasConnectedOnce: false,
    connectError: null,
    refreshConnection: () => { }
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const reconnectAttemptRef = useRef(0);

    const refreshConnection = useCallback(() => {
        if (socket) {
            console.log('Manually refreshing socket connection...');
            // We disconnect and reconnect to force a new handshake IMMEDIATELY.
            // This is critical after login because:
            // 1. The previous connection might be in a long "backoff" wait state (up to 30s).
            // 2. The previous connection attempt used an invalid/missing cookie.
            // By reconnecting now, we send the NEW valid cookie instantly.
            socket.disconnect();
            socket.connect();
            // Reset error state on manual refresh so UI clears while connecting
            setConnectError(null);
            reconnectAttemptRef.current = 0;
        }
    }, [socket]);

    useEffect(() => {
        const socketInstance = io('', {
            path: '/cmsapi/socket.io',
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 100,
            reconnectionDelayMax: 30000,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            reconnectAttemptRef.current = 0;
            setIsConnected(true);
            setHasConnectedOnce(true);
            setConnectError(null);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            // If server disconnected us (e.g. 401), manually trigger reconnect
            // since socket.io won't auto-reconnect on 'io server disconnect'
            if (reason === 'io server disconnect') {
                console.log('Server disconnected us, scheduling reconnect...');
                setTimeout(() => {
                    socketInstance.connect();
                }, 2000);
            }
        });

        socketInstance.on('connect_error', (err) => {
            console.log('Socket connect error:', err);
            reconnectAttemptRef.current++;
            const attempt = reconnectAttemptRef.current;

            // If session is invalid, force a reload to trigger re-auth check (unless already on login page)
            if (err.message.includes('Unauthorized')) {
                console.log('Socket unauthorized, reloading...', window.location.pathname);
                if (!window.location.pathname.includes('/login')) {
                    window.location.reload();
                }
                // We don't return here anymore, so the UI updates while reload happens
            }

            // If we receive a specialized error (like Unauthorized), show it
            setConnectError(err.message);
            // Consider "connected once" (aka attempted) so we stop showing the startup spinner
            setHasConnectedOnce(true);

            if (attempt <= 3) {
                console.log(`Socket connect error(attempt ${attempt}): `, err.message);
            } else if (attempt % 10 === 0) {
                console.log(`Socket still reconnecting(attempt ${attempt})...`);
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, hasConnectedOnce, connectError, refreshConnection }}>
            {children}
        </SocketContext.Provider>
    );
};
