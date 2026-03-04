import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/use-socket';

export function StatusBar() {
    const [status, setStatus] = useState<string | null>(null);
    const [createdAt, setCreatedAt] = useState<number | null>(null);
    const [duration, setDuration] = useState(0);
    const { onAgentStatus } = useSocket();

    useEffect(() => {
        const cleanup = onAgentStatus((data) => {
            if (data.agentName) {
                setStatus(data.agentName);
                const start = data.createdAt || Date.now();
                setCreatedAt(start);
                setDuration(Date.now() - start);
            } else {
                setStatus(null);
                setCreatedAt(null);
                setDuration(0);
            }
        });
        return cleanup;
    }, [onAgentStatus]);

    useEffect(() => {
        if (!status || !createdAt) return;

        const interval = setInterval(() => {
            setDuration(Date.now() - createdAt);
        }, 10000);

        return () => clearInterval(interval);
    }, [status, createdAt]);

    const seconds = Math.floor(duration / 1000);

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
                        <span className="truncate">
                            {status ? `Waiting for ${status} agent` : 'Ready for next message'}
                        </span>
                    </div>
                    {status && (
                        <div className="opacity-90 tabular-nums shrink-0 ml-2 bg-white/20 px-2.5 py-1 rounded-full text-[10px] ring-1 ring-white/30 backdrop-blur-sm">
                            for {seconds}s
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

