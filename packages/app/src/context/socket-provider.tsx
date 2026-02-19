import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { type ServerToClientEvents, type ClientToServerEvents } from '@cms/shared';

interface SocketContextType {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    isConnected: boolean;
    hasConnectedOnce: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false, hasConnectedOnce: false });

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

    useEffect(() => {
        const socketInstance = io('', {
            path: '/cmsapi/socket.io',
            withCredentials: true,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            setHasConnectedOnce(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.log('Socket connect error (CMS may still be starting):', err.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, hasConnectedOnce }}>
            {children}
        </SocketContext.Provider>
    );
};
