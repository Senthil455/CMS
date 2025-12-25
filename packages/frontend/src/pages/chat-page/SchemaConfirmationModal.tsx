import { useRef, useEffect, useState } from 'react';
import { X, Check, FileJson, MinusCircle, PlusCircle, AlertCircle } from 'lucide-react';
import type { SchemaSummary, SchemaSummaryResponse } from '@cms/shared';

interface SchemaConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (response: SchemaSummaryResponse) => void;
    schemaSummary: SchemaSummary;
}

export function SchemaConfirmationModal({ isOpen, onClose, onConfirm, schemaSummary }: SchemaConfirmationModalProps) {
    const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set());
    const modalRef = useRef<HTMLDivElement>(null);

    const toggleSkip = (index: number) => {
        setSkippedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleConfirm = () => {
        const response: SchemaSummaryResponse = {
            proceed: true,
            entities: schemaSummary.entities.map((ent, idx) => ({
                ...ent,
                op: skippedIndices.has(idx) ? 'skip' : ent.op
            }))
        };
        onConfirm(response);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-app-surface w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <FileJson className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Confirm Schema Changes</h2>
                            <p className="text-xs text-primary-muted font-medium">Review proposed changes before applying</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-app-muted rounded-full transition-colors text-primary-muted hover:text-primary"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        {schemaSummary.entities.map((item, index) => {
                            const isSkipped = skippedIndices.has(index);
                            const isNew = item.op === 'add';

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border transition-all duration-200 ${isSkipped
                                        ? 'bg-app-muted/20 border-border opacity-60'
                                        : isNew
                                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                            : item.op === 'update'
                                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {isNew ? (
                                                <PlusCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            ) : item.op === 'update' ? (
                                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            ) : (
                                                <MinusCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            )}
                                            <h3 className="font-bold text-base flex items-center gap-2">
                                                {item.name}
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${isSkipped
                                                    ? 'bg-app-muted text-primary-muted'
                                                    : isNew
                                                        ? 'bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                                        : item.op === 'update'
                                                            ? 'bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                                            : 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                                    }`}>
                                                    {isSkipped ? 'skip' : item.op}
                                                </span>
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => toggleSkip(index)}
                                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${isSkipped
                                                ? 'bg-primary text-app hover:opacity-90'
                                                : 'bg-app-muted text-primary-muted hover:bg-app-surface border border-border'
                                                }`}
                                        >
                                            {isSkipped ? 'Include' : 'Skip'}
                                        </button>
                                    </div>

                                    {!isSkipped && (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 pb-2 border-b border-black/5 dark:border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">Display Name</span>
                                                    <span className="text-xs font-medium">{item.displayName}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">Table</span>
                                                    <span className="text-xs font-mono">{item.tableName}</span>
                                                </div>
                                                {item.schemaId && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">ID</span>
                                                        <span className="text-xs font-mono">{item.schemaId}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-primary-muted uppercase tracking-widest opacity-60">Attributes</p>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-app-muted/50 border-b border-border">
                                                                <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Field</th>
                                                                <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Header</th>
                                                                <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Data Type</th>
                                                                <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Display</th>
                                                                <th className="text-center px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">List</th>
                                                                <th className="text-center px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Detail</th>
                                                                <th className="text-center px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Default</th>
                                                                <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Options</th>
                                                                <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Validation</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {item?.attributes?.map((attr, idx) => (
                                                                <tr key={idx} className="border-b border-border/50 hover:bg-app-muted/30 transition-colors">
                                                                    <td className="px-2 py-2 font-bold text-primary">{attr.field}</td>
                                                                    <td className="px-2 py-2">{attr.header}</td>
                                                                    <td className="px-2 py-2 font-mono text-primary">{attr.dataType}</td>
                                                                    <td className="px-2 py-2 font-mono">{attr.displayType}</td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold ${attr.inList ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                                            {attr.inList ? 'Yes' : 'No'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold ${attr.inDetail ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                                            {attr.inDetail ? 'Yes' : 'No'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold ${attr.isDefault ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                                            {attr.isDefault ? 'Yes' : 'No'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-2 font-mono text-[10px] max-w-[120px] truncate" title={attr.options}>{attr.options || '-'}</td>
                                                                    <td className="px-2 py-2 font-mono text-[10px] max-w-[150px] truncate" title={attr.validation}>{attr.validation || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-app-muted/30 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-app-muted transition-colors text-primary-muted hover:text-primary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-5 py-2.5 bg-primary text-app rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Confirm & Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
