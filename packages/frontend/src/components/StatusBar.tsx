import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@cms/shared';
import { config } from '../config';
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
            const response = await axios.get(`${config.API_BASE_URL}${ENDPOINTS.CHAT.STATUS}`, {
                withCredentials: true
            });

            if (response.data.success && response.data.data.statuses) {
                const statuses = response.data.data.statuses;
                const latest = statuses.length > 0 ? statuses[statuses.length - 1] : null;

                if (latest) {
                    emptyCountRef.current = 0;
                    if (latest !== lastStatusRef.current) {
                        setStatus(latest);
                        setDuration(0);
                        lastStatusRef.current = latest;
                    } else {
                        setDuration(prev => prev + 500);
                    }
                } else {
                    // Stop polling after 3 consecutive empty responses
                    emptyCountRef.current++;
                    if (emptyCountRef.current >= 3) {
                        setIsPolling(false);
                        setStatus(null);
                        setDuration(0);
                        lastStatusRef.current = null;
                    }
                }
            }
        } catch (error) {
            // Silently ignore polling errors
        }
    }, []);

    // Start polling when any message is received (indicates agent activity)
    useEffect(() => {
        const cleanup = onMessageReceived((message) => {
            if (message.role === 'assistant') {
                emptyCountRef.current = 0;
                setIsPolling(true);
            }
        });
        return cleanup;
    }, [onMessageReceived]);

    // Polling interval - only runs when isPolling is true
    useEffect(() => {
        if (!isPolling) return;

        fetchStatus(); // Fetch immediately
        const interval = setInterval(fetchStatus, 500);
        return () => clearInterval(interval);
    }, [isPolling, fetchStatus]);

    if (!status) return null;

    const seconds = (duration / 1000).toFixed(1);

    return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="truncate">{status}</span>
            </div>
            <div className="opacity-80 tabular-nums shrink-0 ml-2 bg-white/20 px-2 py-0.5 rounded">
                {seconds}s
            </div>
        </div>
    );
}

