import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { ENDPOINTS, type AgentName } from '@cms/shared';
import { Loader2, ListChecks, ChevronRight, ChevronDown, Play } from 'lucide-react';
import { getAgentIcon } from './message-bubble';

const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);

interface AgentTaskItem {
    index: number;
    agentName: AgentName;
    status: 'pending' | 'finished';
    description?: string;
    schemaId?: string;
}

interface AgentTask {
    id: number;
    status: 'pending' | 'finished';
    description?: string;
    items: AgentTaskItem[];
}

interface TasksListProps {
    onSwitchToChat: () => void;
    onSend: (message: string, providerName: string) => void;
}

export function TasksList({ onSwitchToChat, onSend }: TasksListProps) {
    const { data, error, isLoading, mutate } = useSWR(`${''}${ENDPOINTS.APP_TASKS.LATEST}`, fetcher, {
        refreshInterval: 5000 // auto-refresh every 5s to keep statuses updated
    });

    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const tasks: AgentTask[] = data?.data || [];

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleExecute = (taskId: number) => {
        onSend(`@execute-task ${taskId}`, 'gemini');
        onSwitchToChat();
    };

    const toggleItemStatus = async (taskId: number, index: number) => {
        try {
            const url = ENDPOINTS.APP_TASKS.TOGGLE_ITEM
                .replace(':taskId', taskId.toString())
                .replace(':index', index.toString());
            await axios.patch(url, {}, { withCredentials: true });
            mutate(); // Refresh the list
        } catch (err) {
            console.error('Failed to toggle item status', err);
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
                <p className="text-xs text-red-500">Failed to load tasks.</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="p-8 text-center opacity-50">
                <ListChecks className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">No tasks found</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
            {tasks.map((task) => {
                const isExpanded = expandedIds.has(task.id);
                return (
                    <div key={task.id} className="group">
                        <div
                            className={`w-full text-left p-3 hover:bg-app-muted/50 transition-colors cursor-pointer ${isExpanded ? 'bg-app-muted/30' : ''}`}
                            onClick={() => toggleExpand(task.id)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-primary-muted shrink-0" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-primary-muted shrink-0" />
                                    )}
                                    <ListChecks className="w-3.5 h-3.5 shrink-0 text-primary-muted" />
                                    <span className="font-bold text-xs truncate">
                                        Task #{task.id}
                                    </span>
                                </div>
                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${task.status === 'finished' ? 'bg-green-100/50 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-amber-100/50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                    {task.status.toUpperCase()}
                                </div>
                            </div>
                            {task.description && (
                                <div className="pl-6 mb-1 text-[11px] text-primary truncate" title={task.description}>
                                    {task.description}
                                </div>
                            )}
                            <div className="pl-6 text-[10px] text-primary-muted flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span>{task.items.length} items</span>
                                    <span>•</span>
                                    <span>{task.items.filter(i => i.status === 'finished').length} completed</span>
                                </div>
                                {isExpanded && task.status === 'pending' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExecute(task.id);
                                        }}
                                        className="flex items-center gap-1.5 px-2 py-1 bg-primary text-white text-[9px] rounded font-bold hover:shadow-md transition-all active:scale-95"
                                    >
                                        <Play className="w-2.5 h-2.5" />
                                        EXECUTE
                                    </button>
                                )}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="bg-app-surface border-t border-border p-2 space-y-2">
                                {task.items.map((item, i) => {
                                    const Icon = getAgentIcon(item.agentName);

                                    return (
                                        <div key={`${task.id}-${item.index}`} className="flex items-start gap-2 p-2 rounded relative border border-border/50 bg-app-muted/10">
                                            {/* Connector line for tree effect */}
                                            {i !== task.items.length - 1 && (
                                                <div className="absolute left-6 top-8 bottom-[-16px] w-[1px] bg-border/50 z-0 hidden sm:block"></div>
                                            )}

                                            <div className="relative z-10 shrink-0 mt-0.5">
                                                <div className="w-8 h-8 rounded bg-app-muted flex items-center justify-center border border-border">
                                                    <Icon className="w-4 h-4 text-primary-muted" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-medium text-[11px] text-primary mb-0.5 uppercase tracking-wide">
                                                        {item.agentName.replace(/_/g, ' ')}
                                                    </div>
                                                    <button
                                                        onClick={() => toggleItemStatus(task.id, item.index)}
                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${item.status === 'finished' ? 'text-green-500 bg-green-500/10' : 'text-amber-500 bg-amber-500/10'}`}
                                                        title="Click to toggle status"
                                                    >
                                                        {item.status}
                                                    </button>
                                                </div>
                                                {item.description && (
                                                    <div className="text-[11px] text-primary-muted truncate" title={item.description}>
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
