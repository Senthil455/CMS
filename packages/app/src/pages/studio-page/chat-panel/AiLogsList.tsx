import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Loader2, Database, Calendar, Cpu, Clock, Copy, Check, Play, Trash2 } from 'lucide-react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { ENDPOINTS } from '@cms/shared';
import toast from 'react-hot-toast';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

interface AiLog {
    id: number;
    handler: string;
    response: string;
    timestamp: string;
}

export function AiLogsList({ onSwitchToChat }: { onSwitchToChat?: () => void }) {
    const { data, error, isLoading, mutate } = useSWR(`${''}${ENDPOINTS.AI.LOGS}`, fetcher);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
    const [copied, setCopied] = useState<number | null>(null);
    const [actingLogId, setActingLogId] = useState<number | null>(null);

    const logs: AiLog[] = data?.data || [];

    const handleCopy = (id: number, text: string) => {
        try {
            const formatted = JSON.stringify(JSON.parse(text), null, 2);
            navigator.clipboard.writeText(formatted);
        } catch (e) {
            navigator.clipboard.writeText(text);
        }
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleAct = async (log: AiLog, continuePipeline: boolean = false) => {
        try {
            setActingLogId(log.id);
            await axios.post(
                `${''}${ENDPOINTS.AI.ACT_ON_LOG.replace(':id', log.id.toString())}`,
                { continuePipeline },
                { withCredentials: true }
            );
            toast.success('Action triggered');
            if (continuePipeline && onSwitchToChat) {
                onSwitchToChat();
            }
        } catch (e) {
            console.error('Failed to act on log', e);
            toast.error('Failed to trigger action');
        } finally {
            setActingLogId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary-muted" />
            </div>
        );
    }

    if (error || (data && !data.success)) {
        return (
            <div className="p-4 text-center">
                <p className="text-xs text-red-500">Failed to load logs.</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="p-8 text-center opacity-50">
                <Database className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">No logs found</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
            {logs.map((log) => (
                <div key={log.id} className="group">
                    <button
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        className={`w-full text-left p-3 hover:bg-app-muted/50 transition-colors ${expandedLogId === log.id ? 'bg-app-muted/30' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Cpu className={`w-3.5 h-3.5 shrink-0 ${expandedLogId === log.id ? 'text-primary' : 'text-primary-muted'}`} />
                                <span className="font-bold text-xs truncate">
                                    {log.handler}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-primary-muted/50">#{log.id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-primary-muted font-medium">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(log.timestamp).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </button>

                    {expandedLogId === log.id && (
                        <div className="p-3 bg-app-muted/20 text-xs border-t border-border animate-in slide-in-from-top-2 duration-200">
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => handleAct(log, false)}
                                    disabled={actingLogId === log.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg font-bold hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {actingLogId === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                    Act
                                </button>
                                <button
                                    onClick={() => handleAct(log, true)}
                                    disabled={actingLogId === log.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {actingLogId === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                    Act & Continue
                                </button>
                                <button
                                    onClick={() => handleCopy(log.id, log.response)}
                                    className="px-3 py-1.5 border border-border bg-app-surface text-primary rounded-lg font-medium hover:border-primary/50 transition-all"
                                >
                                    {copied === log.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Are you sure you want to delete this log?')) return;
                                        try {
                                            await axios.delete(
                                                `${''}${ENDPOINTS.AI.DELETE_LOG.replace(':id', log.id.toString())}`,
                                                { withCredentials: true }
                                            );
                                            toast.success('Log deleted');
                                            mutate(); // Refresh the list
                                        } catch (error) {
                                            toast.error('Failed to delete log');
                                        }
                                    }}
                                    className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-500 rounded-lg font-medium hover:bg-red-100 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="bg-app-surface border border-border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(log.response);
                                        return (
                                            <JsonView
                                                src={parsed}
                                                theme="default"
                                                displaySize={false}
                                                enableClipboard={false}
                                                collapsed={2}
                                                style={{ fontSize: '10px' }}
                                            />
                                        );
                                    } catch (e) {
                                        return (
                                            <pre className="p-2 font-mono whitespace-pre-wrap break-all text-[10px]">
                                                {log.response}
                                            </pre>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
