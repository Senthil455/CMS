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
            if (message.sender === 'assistant') {
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
        <div className="bg-blue-600/10 text-blue-600 px-3 py-2 text-[10px] font-bold flex items-center justify-between border-y border-blue-600/10 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                <span className="truncate">Agent: {status}</span>
            </div>
            <div className="opacity-70 tabular-nums shrink-0 ml-2">
                *** ({seconds}s)
            </div>
        </div>
    );
}

