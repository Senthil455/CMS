import { Trash2, AlertTriangle, X } from 'lucide-react';
import { type SchemaDto } from '@cms/shared';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    item: SchemaDto | null;
    isDeleting: boolean;
}

export function DeleteConfirmDialog({ isOpen, onClose, onConfirm, item, isDeleting }: DeleteConfirmDialogProps) {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-app-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-red-500/10">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Delete {item.type}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1 hover:bg-black/5 rounded-lg text-primary-muted hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-primary text-sm leading-relaxed mb-4">
                        Are you sure you want to delete <span className="font-bold">"{item.name}"</span>?
                    </p>
                    <p className="text-primary-muted text-xs leading-relaxed bg-app-muted p-3 rounded-lg border border-border">
                        This action cannot be undone. This {item.type} will be permanently removed from the system.
                    </p>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-primary-muted hover:text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isDeleting ? (
                                <>Deleting...</>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete Forever
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
