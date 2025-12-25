import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Database, Calendar, Cpu, Clock, Copy, Check } from 'lucide-react';
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
        try {
            const parsed = JSON.parse(value);
            return (
                <div className="bg-app-muted/50 rounded-xl p-6 border border-border overflow-hidden">
                    <JsonView
                        src={parsed}
                        theme="default"
                        displaySize={true}
                        enableClipboard={true}
                        collapsed={false}
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
        <div className="h-screen bg-app text-primary flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b border-border bg-app-surface/80 backdrop-blur-md z-10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-app-muted rounded-full transition-colors border border-border"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold flex items-center gap-3">
                            <Database className="w-6 h-6 text-primary" />
                            AI Response Logs
                        </h1>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Sidebar List */}
                <aside className="w-80 md:w-96 border-r border-border bg-app-surface overflow-y-auto flex flex-col shrink-0">
                    <div className="p-4 border-b border-border bg-app-muted/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <h2 className="text-[10px] font-bold text-primary-muted uppercase tracking-[0.2em]">Logs History</h2>
                        <span className="text-[10px] bg-app-muted px-2 py-0.5 rounded-full font-bold text-primary-muted">{logs.length} Total</span>
                    </div>

                    <div className="divide-y divide-border">
                        {logs.length === 0 ? (
                            <div className="p-12 text-center">
                                <Database className="w-8 h-8 text-primary-muted mx-auto mb-3 opacity-20" />
                                <p className="text-xs text-primary-muted font-medium">No logs yet</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <button
                                    key={log.id}
                                    onClick={() => setSelectedLogId(log.id)}
                                    className={`w-full group flex flex-col p-5 text-left transition-all relative ${selectedLogId === log.id
                                        ? 'bg-primary/5'
                                        : 'hover:bg-app-muted/50'
                                        }`}
                                >
                                    {selectedLogId === log.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Cpu className={`w-4 h-4 shrink-0 ${selectedLogId === log.id ? 'text-primary' : 'text-primary-muted'}`} />
                                            <span className={`font-bold text-sm truncate ${selectedLogId === log.id ? 'text-primary' : ''}`}>
                                                {log.orchestrator}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-primary-muted/50 whitespace-nowrap">#{log.id}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-primary-muted font-medium">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(log.timestamp).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Right Panel: Detail View */}
                <main className="flex-1 overflow-y-auto bg-app-muted/20">
                    {(error || (data && !data.success)) ? (
                        <div className="p-8">
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
                                <span className="text-sm font-medium">Failed to load AI logs. Please make sure you are logged in.</span>
                            </div>
                        </div>
                    ) : selectedLog ? (
                        <div className="p-8 animate-in fade-in transition-all duration-300">
                            <div className="max-w-4xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-app-surface p-5 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                                        <div className="p-2.5 bg-primary/10 rounded-xl">
                                            <Cpu className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-primary-muted uppercase tracking-widest mb-0.5">Orchestrator</p>
                                            <p className="font-bold text-base truncate">{selectedLog.orchestrator}</p>
                                        </div>
                                    </div>
                                    <div className="bg-app-surface p-5 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                                        <div className="p-2.5 bg-primary/10 rounded-xl">
                                            <Calendar className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary-muted uppercase tracking-widest mb-0.5">Date</p>
                                            <p className="font-bold text-base">{new Date(selectedLog.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="bg-app-surface p-5 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                                        <div className="p-2.5 bg-primary/10 rounded-xl">
                                            <Clock className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary-muted uppercase tracking-widest mb-0.5">Time</p>
                                            <p className="font-bold text-base">{new Date(selectedLog.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-app-surface rounded-3xl border border-border shadow-xl overflow-hidden">
                                    <div className="px-8 py-6 border-b border-border bg-app-muted/30 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-sm font-bold text-primary-muted uppercase tracking-widest">Response Content</h2>
                                            <p className="text-[10px] text-primary-muted mt-1 font-mono uppercase italic">{selectedLog.response.length.toLocaleString()} bytes</p>
                                        </div>
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
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-primary-muted opacity-40">
                            <div className="w-20 h-20 bg-app-muted rounded-full flex items-center justify-center mb-6">
                                <Database className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Select a log</h3>
                            <p className="text-sm font-medium">Click on a log entry from the sidebar to view details</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
