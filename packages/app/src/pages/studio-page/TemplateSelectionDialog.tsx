
import { useState } from 'react';
import { Layout, Type, Image, Check, X, Ban } from 'lucide-react';

interface TemplateOption {
    id: string;
    name: string;
    description: string;
}

interface TemplateSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedTemplateId: string) => void;
    templates: TemplateOption[];
    pageType?: string;
}

export function TemplateSelectionDialog({
    isOpen,
    onClose,
    onConfirm,
    templates,
}: TemplateSelectionDialogProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedId !== null) {
            onConfirm(selectedId);
        }
    };

    const getIcon = (id: string) => {
        switch (id) {
            case '': return <Ban className="w-8 h-8 text-gray-400" />;
            case 'modern': return <Layout className="w-8 h-8 text-blue-500" />;
            case 'classic': return <Type className="w-8 h-8 text-gray-700" />;
            case 'minimal': return <Image className="w-8 h-8 text-emerald-500" />;
            default: return <Layout className="w-8 h-8" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-app-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-app-muted/30">
                    <div>
                        <h2 className="text-xl font-bold">Select Page Template</h2>
                        <p className="text-sm text-primary-muted mt-1">Choose a visual style for your generated page.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-primary-muted hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedId(template.id)}
                                className={`
                                    cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-app-muted
                                    flex flex-col items-center text-center gap-4 relative group
                                    ${selectedId === template.id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                        : 'border-border hover:border-primary/50'}
                                `}
                            >
                                {selectedId === template.id && (
                                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 animate-in zoom-in duration-200">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}

                                <div className={`p-4 rounded-full shadow-sm transition-transform group-hover:scale-110 ${selectedId === template.id ? 'bg-background shadow-md' : 'bg-app-muted'}`}>
                                    {getIcon(template.id)}
                                </div>

                                <div>
                                    <h3 className={`font-bold mb-2 ${selectedId === template.id ? 'text-primary' : 'text-foreground'}`}>
                                        {template.name}
                                    </h3>
                                    <p className="text-xs text-primary-muted leading-relaxed">
                                        {template.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-app-muted/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-primary-muted hover:text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedId === null}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                    >
                        Start Generation
                    </button>
                </div>
            </div>
        </div>
    );
}
