import { useState } from 'react';
import { X, Sparkles, PenTool, ArrowRight } from 'lucide-react';

interface AddQueryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUseAI: () => void;
    onManualCreate: (name: string) => void;
}

export function AddQueryDialog({ isOpen, onClose, onUseAI, onManualCreate }: AddQueryDialogProps) {
    const [mode, setMode] = useState<'selection' | 'manual'>('selection');
    const [queryName, setQueryName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const validateName = (name: string) => {
        // Enforce camelCase: starts with lowercase letter, allows alphanumeric
        const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
        if (!name) return "Name is required";
        if (!camelCaseRegex.test(name)) return "Query name must be in camelCase (e.g., myQueryName)";
        return "";
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateName(queryName.trim());
        if (validationError) {
            setError(validationError);
            return;
        }

        if (queryName.trim()) {
            onManualCreate(queryName.trim());
            setQueryName('');
            setError('');
            setMode('selection');
        }
    };

    const handleClose = () => {
        setMode('selection');
        setQueryName('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-app-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-app-muted/30">
                    <h2 className="text-lg font-bold text-primary">
                        {mode === 'selection' ? 'Create New Query' : 'Name Your Query'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-white/10 rounded-lg text-primary-muted hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {mode === 'selection' ? (
                        <div className="grid gap-4">
                            <button
                                onClick={onUseAI}
                                className="flex flex-col gap-2 p-4 border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-primary">AI Generate</span>
                                </div>
                                <p className="text-sm text-primary-muted pl-[52px]">
                                    Describe your query and let AI build it for you.
                                </p>
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-app-surface px-2 text-primary-muted">Or</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setMode('manual')}
                                className="flex flex-col gap-2 p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                        <PenTool className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-primary">Manual Create</span>
                                </div>
                                <p className="text-sm text-primary-muted pl-[52px]">
                                    Start with a blank query and configure it manually.
                                </p>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary-muted">
                                    Query Name
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={queryName}
                                    onChange={(e) => {
                                        setQueryName(e.target.value);
                                        if (error) setError('');
                                    }}
                                    placeholder="e.g. getOrdersByStatus"
                                    className={`app-input w-full ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                                />
                                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                                <p className="text-xs text-primary-muted/70">
                                    Use camelCase (e.g., "myQueryName").
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('selection');
                                        setError('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-primary-muted hover:text-primary transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!queryName.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create Query
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
