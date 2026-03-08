import { useState, useEffect } from 'react';
import { useSocket } from './use-socket';

export function useAgentStatus() {
    const [status, setStatus] = useState<string | null>(null);
    const [createdAt, setCreatedAt] = useState<number | null>(null);
    const { onAgentStatus } = useSocket();

    useEffect(() => {
        const cleanup = onAgentStatus((data) => {
            if (data.agentName) {
                setStatus(data.agentName);
                const start = data.createdAt || Date.now();
                setCreatedAt(start);
            } else {
                setStatus(null);
                setCreatedAt(null);
            }
        });
        return cleanup;
    }, [onAgentStatus]);

    return { status, createdAt, isAgentActive: !!status };
}
