import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Database, ChevronRight, Calendar, Cpu, Clock, Copy, Check } from 'lucide-react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { config } from '../config';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

interface AiLog {
    id: number;
    orchestrator: string;
    response: string;
    timestamp: string;
}

export default function AiLogsPage() {
    const navigate = useNavigate();
    const { data, error, isLoading } = useSWR(`${config.API_BASE_URL}/api/ai-logs`, fetcher);
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const logs: AiLog[] = data?.data || [];
    const selectedLog = logs.find(log => log.id === selectedLogId);

    const handleCopy = (text: string) => {
        try {
            const formatted = JSON.stringify(JSON.parse(text), null, 2);
            navigator.clipboard.writeText(formatted);
        } catch (e) {
            navigator.clipboard.writeText(text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        /* ... previous loading block ... */
        return (
            <div className="flex items-center justify-center min-h-screen bg-app">
                <Loader2 className="w-10 h-10 animate-spin text-primary-muted" />
            </div>
        );
    }

    const renderValue = (value: string) => {
        /* ... previous renderValue implementation ... */
        try {
            const parsed = JSON.parse(value);
            return (
                <div className="bg-app-muted/50 rounded-xl p-6 border border-border overflow-hidden">
                    <JsonView
                        src={parsed}
                        theme="default"
                        displaySize={true}
                        enableClipboard={true}
                        collapsed={2}
                    />
                </div>
            );
        } catch (e) {
            return (
                <pre className="bg-app-muted/50 p-6 rounded-xl border border-border text-xs font-mono whitespace-pre-wrap break-all overflow-auto">
                    {value}
                </pre>
            );
        }
    };

    return (
        <div className="min-h-screen bg-app text-primary flex flex-col">
            {/* Header */}
/* ... previous header block ... */
            <header className="border-b border-border bg-app-surface/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => selectedLogId ? setSelectedLogId(null) : navigate('/')}
                            className="p-2 hover:bg-app-muted rounded-full transition-colors border border-border"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold flex items-center gap-3">
                            <Database className="w-6 h-6 text-primary" />
                            {selectedLog ? 'Log Details' : 'AI Response Logs'}
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                {(error || (data && !data.success)) && (
                    /* ... error alert ... */
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3">
                        <span className="text-sm font-medium">Failed to load AI logs. Please make sure you are logged in.</span>
                    </div>
                )}

                {selectedLog ? (
                    /* Detail View */
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
/* ... previous detail cards ... */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-app-surface p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Cpu className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary-muted uppercase tracking-widest mb-1">Orchestrator</p>
                                    <p className="font-bold text-lg">{selectedLog.orchestrator}</p>
                                </div>
                            </div>
                            <div className="bg-app-surface p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Calendar className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary-muted uppercase tracking-widest mb-1">Date</p>
                                    <p className="font-bold text-lg">{new Date(selectedLog.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="bg-app-surface p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary-muted uppercase tracking-widest mb-1">Time</p>
                                    <p className="font-bold text-lg">{new Date(selectedLog.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-app-surface rounded-3xl border border-border shadow-xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-border bg-app-muted/30 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-primary-muted uppercase tracking-widest">Raw Response Payload</h2>
                                <button
                                    onClick={() => handleCopy(selectedLog.response)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${copied
                                            ? 'bg-green-500/10 border-green-500/50 text-green-600'
                                            : 'bg-app-surface border-border hover:border-primary/50 text-primary-muted hover:text-primary shadow-sm active:scale-95'
                                        }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Formatted JSON'}
                                </button>
                            </div>
                            <div className="p-8">
                                {renderValue(selectedLog.response)}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div className="grid gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {logs.length === 0 ? (
                            <div className="text-center py-24 bg-app-surface rounded-3xl border border-border shadow-sm">
                                <div className="w-20 h-20 bg-app-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Database className="w-10 h-10 text-primary-muted" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No logs found</h3>
                                <p className="text-primary-muted">AI responses will appear here once they are generated.</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <button
                                    key={log.id}
                                    onClick={() => setSelectedLogId(log.id)}
                                    className="group flex items-center justify-between p-6 bg-app-surface hover:bg-app-muted/50 rounded-2xl border border-border transition-all hover:shadow-lg text-left"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Cpu className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-lg">{log.orchestrator}</span>
                                                <span className="text-[10px] bg-app-muted px-2 py-0.5 rounded-full font-bold text-primary-muted uppercase tracking-widest">ID: {log.id}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-primary-muted font-medium">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(log.timestamp).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-[10px] font-bold text-primary-muted uppercase tracking-widest mb-0.5">Response Size</p>
                                            <p className="text-xs font-mono">{log.response.length.toLocaleString()} bytes</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-primary-muted group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
