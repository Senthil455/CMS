import { X, AlertTriangle, UploadCloud } from 'lucide-react';

interface PublishConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPublishing: boolean;
}

export function PublishConfirmDialog({ isOpen, onClose, onConfirm, isPublishing }: PublishConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-app-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-orange-500/10">
                    <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Confirm Publish</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPublishing}
                        className="p-1 hover:bg-black/5 rounded-lg text-primary-muted hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-primary text-sm leading-relaxed mb-4">
                        Do you want to publish this query?
                    </p>
                    <p className="text-primary-muted text-xs leading-relaxed bg-app-muted p-3 rounded-lg border border-border">
                        Publishing might affect pages using this query and will expose data via the API.
                        Once published, this version will be live.
                    </p>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isPublishing}
                            className="px-4 py-2 text-sm font-medium text-primary-muted hover:text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isPublishing}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isPublishing ? (
                                <>Publishing...</>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4" />
                                    Publish Query
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
