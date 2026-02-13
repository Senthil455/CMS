import { X, Clock, CheckCircle2 } from 'lucide-react';
import { useSchemaHistory } from '../../../../hooks/use-schemas';
import { format } from 'date-fns';

interface SchemaHistoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    schemaId: string;
}

export function SchemaHistoryDialog({ isOpen, onClose, schemaId }: SchemaHistoryDialogProps) {
    const { history, isLoading } = useSchemaHistory(isOpen ? schemaId : null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-app-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-app-muted/30">
                    <div className="flex items-center gap-2 text-primary">
                        <Clock className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Version History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg text-primary-muted hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 text-primary-muted">
                            <span className="animate-spin mr-2">⏳</span> Loading history...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-primary-muted">
                            <Clock className="w-8 h-8 opacity-20 mb-2" />
                            <p>No history available</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-app-muted text-primary-muted font-bold sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Version</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {history.map((version) => (
                                    <tr key={version.id} className="hover:bg-app-muted/50 transition-colors">
                                        <td className="px-4 py-3 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs opacity-70">
                                                    #{version.id}
                                                </span>
                                                {version.isLatest && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                                                        LATEST
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            {version.publicationStatus === 'published' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-4xl bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-4xl bg-gray-500/10 text-gray-500 text-xs font-bold border border-gray-500/20">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-middle text-primary-muted">
                                            {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-4 py-3 align-middle text-right">
                                            {/* Future: Add Restore/View button */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
