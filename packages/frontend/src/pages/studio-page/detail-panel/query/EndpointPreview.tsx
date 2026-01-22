import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface EndpointPreviewProps {
    baseUrl: string;
    params: Record<string, string>;
    trigger: number;
}

export function EndpointPreview({ baseUrl, params, trigger }: EndpointPreviewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fullUrl = new URL(baseUrl, window.location.origin);
    fullUrl.searchParams.append('sandbox', 'true');
    Object.entries(params).forEach(([key, value]) => {
        if (value) fullUrl.searchParams.append(key, value);
    });

    useEffect(() => {
        if (trigger === 0) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(fullUrl.toString());
                const json = await res.json();
                setData(json);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [trigger]);

    if (!trigger) return null;

    return (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-bold text-primary-muted uppercase tracking-widest">Request URL</div>
                <div className="flex-1 h-px bg-border"></div>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-[10px] text-foreground break-all mb-4 select-all">
                {fullUrl.toString().replace(fullUrl.origin + '/', '')}
            </div>

            <div className="text-xs font-bold text-primary-muted uppercase tracking-widest mb-2">Response Preview</div>
            {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching data...
                </div>
            ) : error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-medium">
                    Error: {error}
                </div>
            ) : data ? (
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-xl text-xs font-mono overflow-auto max-h-80 border border-slate-800 shadow-xl custom-scrollbar">
                    {JSON.stringify(data, null, 2)}
                </pre>
            ) : null}
        </div>
    );
}
