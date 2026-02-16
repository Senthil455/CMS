import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@cms/shared';
import { useSocket } from '../hooks/use-socket';

export function StatusBar() {
    const [status, setStatus] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [isPolling, setIsPolling] = useState(false);
    const lastStatusRef = useRef<string | null>(null);
    const emptyCountRef = useRef(0);
    const { onMessageReceived } = useSocket();

    const fetchStatus = useCallback(async () => {
        try {
            const response = await axios.get(`${''}${ENDPOINTS.CHAT.STATUS}`, {
                withCredentials: true
            });

            if (response.data.success && response.data.data.statuses) {
                const statuses = response.data.data.statuses;
                const latest = statuses.length > 0 ? statuses[statuses.length - 1] : null;

                if (latest) {
                    setIsPolling(true);
                    emptyCountRef.current = 0;
                    if (latest !== lastStatusRef.current) {
                        setStatus(latest);
                        setDuration(0);
                        lastStatusRef.current = latest;
                    } else {
                        setDuration(prev => prev + 500);
                    }
                } else {
                    emptyCountRef.current++;
                    if (emptyCountRef.current >= 3) {
                        setIsPolling(false);
                        setStatus(null);
                        setDuration(0);
                        lastStatusRef.current = null;
                    }
                }
            }
        } catch (error: any) {
            // Don't stop polling on error, maybe backend recovers
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        const cleanup = onMessageReceived(() => {
            emptyCountRef.current = 0;
            setIsPolling(true);
        });
        return cleanup;
    }, [onMessageReceived]);

    useEffect(() => {
        if (!isPolling) return;
        const interval = setInterval(fetchStatus, 500);
        return () => clearInterval(interval);
    }, [isPolling, fetchStatus]);

    const seconds = (duration / 1000).toFixed(1);

    return (
        <div className="flex flex-col gap-2 p-2 bg-gray-100 border-t border-gray-200">
            <div className={`transition-all duration-300 ${status ? 'opacity-100 translate-y-0 scale-100' : 'opacity-40 grayscale translate-y-1 scale-[0.98]'}`}>
                <div className={`${status ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-500'} text-white px-4 py-3 text-xs font-bold flex items-center justify-between shadow-lg rounded-md border border-white/10`}>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className={`w-2 h-2 bg-white rounded-full ${status ? 'animate-bounce shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'opacity-50'}`} style={{ animationDelay: '0ms' }} />
                            <div className={`w-2 h-2 bg-white rounded-full ${status ? 'animate-bounce shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'opacity-50'}`} style={{ animationDelay: '150ms' }} />
                            <div className={`w-2 h-2 bg-white rounded-full ${status ? 'animate-bounce shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'opacity-50'}`} style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="truncate">{status ?? (isPolling ? 'Agent is working...' : 'Ready for next command')}</span>
                    </div>
                    {status && (
                        <div className="opacity-90 tabular-nums shrink-0 ml-2 bg-white/20 px-2.5 py-1 rounded-full text-[10px] ring-1 ring-white/30 backdrop-blur-sm">
                            {seconds}s
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

