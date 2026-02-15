import { Loader2, Copy, Check } from 'lucide-react';
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
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedResult, setCopiedResult] = useState(false);

    const executionUrl = new URL(baseUrl, window.location.origin);
    executionUrl.searchParams.set('sandbox', 'true');
    Object.entries(params).forEach(([key, value]) => {
        if (value) executionUrl.searchParams.append(key, value);
    });

    const displayUrl = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value && key !== 'sandbox') displayUrl.searchParams.append(key, value);
    });

    useEffect(() => {
        if (trigger === 0) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(executionUrl.toString());
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

    const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy;', err);
        }
    };

    if (!trigger) return null;

    return (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="text-xs font-bold text-primary-muted uppercase tracking-widest">Request URL</div>
                </div>
                <div className="flex-1 h-px bg-border"></div>
                {data ? (
                    <button
                        onClick={() => copyToClipboard(`URL: ${displayUrl.toString()}\n\nResult:\n${JSON.stringify(data, null, 2)}`, setCopiedResult)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-[10px] font-bold text-primary rounded transition-colors"
                    >
                        {copiedResult ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copiedResult ? 'Copied Both!' : 'Copy URL & Result'}
                    </button>
                ) : (
                    <button
                        onClick={() => copyToClipboard(displayUrl.toString(), setCopiedUrl)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 hover:bg-muted text-[10px] font-bold text-primary-muted rounded transition-colors"
                    >
                        {copiedUrl ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copiedUrl ? 'Copied!' : 'Copy URL'}
                    </button>
                )}
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-[10px] text-foreground break-all mb-4 select-all">
                {displayUrl.toString()}
            </div>

            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-xs font-bold text-primary-muted uppercase tracking-widest">Response Preview</div>
                <div className="flex-1 h-px bg-border"></div>
            </div>
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
