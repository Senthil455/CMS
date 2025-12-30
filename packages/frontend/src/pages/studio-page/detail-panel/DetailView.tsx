import { type SchemaDto } from '@cms/shared';
import { FileCode, Info, Edit2 } from 'lucide-react';

interface DetailViewProps {
    item: SchemaDto | null;
    onEdit: () => void;
}

export function DetailView({ item, onEdit }: DetailViewProps) {
    if (!item) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-primary-muted bg-app/50">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select an item from the explorer to view details</p>
                <p className="text-sm opacity-60 mt-1">You can explore entities, queries, and pages defined in CMS</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-app overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-app-surface shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{item.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-app-muted rounded-full text-primary-muted font-medium uppercase tracking-wider">
                                {item.type}
                            </span>
                            <span className="text-xs text-primary-muted font-mono">{item.schemaId}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {item.type === 'entity' && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-3 py-1.5 bg-app-muted hover:bg-border rounded-lg text-xs font-bold transition-all"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Entity
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                <div className="bg-app-surface/50 border border-border rounded-xl p-6 shadow-inner">
                    <pre className="font-mono text-sm text-primary/90 leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(item.settings, null, 4)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
