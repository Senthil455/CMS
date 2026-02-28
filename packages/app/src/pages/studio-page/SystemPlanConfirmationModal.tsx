import { useState, useEffect } from 'react';
import { Database, FileCode, LayoutTemplate, Trash2, X } from 'lucide-react';

export interface SystemPlanItem {
    type: 'entity' | 'query' | 'page';
    name: string;
    description: string;
}

interface SystemPlanConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (plan: SystemPlanItem[]) => void;
    plan: SystemPlanItem[];
}

export function SystemPlanConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    plan
}: SystemPlanConfirmationModalProps) {
    const [editablePlan, setEditablePlan] = useState<SystemPlanItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            setEditablePlan([...plan]);
        }
    }, [isOpen, plan]);

    if (!isOpen) return null;

    const handleDelete = (index: number) => {
        setEditablePlan(prev => prev.filter((_, i) => i !== index));
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'entity': return <Database className="w-4 h-4 text-blue-500" />;
            case 'query': return <FileCode className="w-4 h-4 text-green-500" />;
            case 'page': return <LayoutTemplate className="w-4 h-4 text-purple-500" />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            Review System Architecture Plan
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            The AI has generated the following components. Delete any you do not want before confirming.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-zinc-900">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Generated Components
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {editablePlan.length} items
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {editablePlan.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/50 transition-colors group"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {getIconForType(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {item.name}
                                            </h4>
                                            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                            {item.description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(idx)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Delete this item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {editablePlan.length === 0 && (
                                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                                    No components remaining.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(editablePlan)}
                        disabled={editablePlan.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        Confirm Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
