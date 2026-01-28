import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@cms/shared';
import { config } from '../config';

export function StatusBar() {
    const [status, setStatus] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const lastStatusRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await axios.get(`${config.API_BASE_URL}${ENDPOINTS.CHAT.STATUS}`, {
                    withCredentials: true
                });

                if (response.data.success && response.data.data.statuses) {
                    const statuses = response.data.data.statuses;
                    const latest = statuses.length > 0 ? statuses[statuses.length - 1] : null;

                    if (latest !== lastStatusRef.current) {
                        setStatus(latest);
                        setDuration(0);
                        lastStatusRef.current = latest;
                    } else if (latest !== null) {
                        setDuration(prev => prev + 500);
                    } else {
                        setStatus(null);
                        setDuration(0);
                        lastStatusRef.current = null;
                    }
                }
            } catch (error) {
                // Silently ignore polling errors to avoid UI noise
                console.error('Status polling failed:', error);
            }
        };

        const interval = setInterval(fetchStatus, 500);
        return () => clearInterval(interval);
    }, []);

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
