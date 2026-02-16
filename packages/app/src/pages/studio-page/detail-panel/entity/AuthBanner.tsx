import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, KeyRound } from 'lucide-react';

interface CopyableSnippetProps {
    label: string;
    method: string;
    url: string;
    body?: string;
}

function CopyableSnippet({ label, method, url, body }: CopyableSnippetProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        let text = `URL: ${url}\nMethod: ${method}`;
        if (body) {
            text += `\nPayload:\n${body}`;
        }
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const methodColor = method === 'GET' ? 'text-green-600' : 'text-blue-600';

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-primary-muted/70 uppercase">{label}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-muted rounded transition-colors"
                >
                    {copied ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="flex gap-2 items-start text-[11px] font-mono">
                <span className={`${methodColor} font-bold select-none w-10 shrink-0`}>{method}</span>
                <span className="text-primary break-all">{url}</span>
            </div>
            {body && (
                <pre className="text-[10px] font-mono text-primary-muted bg-gray-950 text-gray-300 p-2 rounded-md border border-gray-800 overflow-x-auto mt-1">{body}</pre>
            )}
        </div>
    );
}

export function AuthBanner() {
    const [isExpanded, setIsExpanded] = useState(false);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-amber-500/10 transition-colors"
            >
                <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Authentication</span>
                <span className="text-[10px] text-amber-600/70 dark:text-amber-500/70 ml-1">— Check status & guest login</span>
                {isExpanded
                    ? <ChevronDown className="w-3 h-3 text-amber-600 ml-auto shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-amber-600 ml-auto shrink-0" />
                }
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-amber-500/20 animation-slide-down">
                    <CopyableSnippet
                        label="Check login status"
                        method="GET"
                        url={`${origin}/api/me`}
                    />
                    <CopyableSnippet
                        label="Guest login (no registration needed)"
                        method="POST"
                        url={`${origin}/api/login`}
                        body={JSON.stringify({ usernameOrEmail: "__guest_", password: "aaa" }, null, 2)}
                    />
                </div>
            )}
        </div>
    );
}
