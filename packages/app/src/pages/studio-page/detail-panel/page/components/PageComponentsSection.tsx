import { Layers, Trash2, Sparkles, X, Check } from 'lucide-react';
import { useState } from 'react';
import type { PageMetadata } from '@cms/shared';

interface PageComponentsSectionProps {
    metadata: PageMetadata;
    selectedComponentId: string | null;
    onSelectComponent: (id: string | null) => void;
    onRemoveComponent?: (id: string) => void;
    onModifyComponent?: (id: string, req: string) => void;
}

export function PageComponentsSection({ metadata, selectedComponentId, onSelectComponent, onRemoveComponent, onModifyComponent }: PageComponentsSectionProps) {
    const components = metadata.components;
    const [editingId, setEditingId] = useState<string | null>(null);
    const [requirement, setRequirement] = useState('');

    if (!components || Object.keys(components).length === 0) return null;

    const componentIds = Object.keys(components);

    const handleModifySubmit = (id: string) => {
        if (requirement.trim() && onModifyComponent) {
            onModifyComponent(id, requirement.trim());
            setEditingId(null);
            setRequirement('');
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Components
                </h3>
                <span className="text-[10px] font-bold text-primary-muted">{componentIds.length} component{componentIds.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    {componentIds.map(id => {
                        const isSelected = selectedComponentId === id;
                        const isEditing = editingId === id;

                        return (
                            <div key={id} className="relative flex items-center group">
                                <button
                                    onClick={() => onSelectComponent(isSelected ? null : id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${isSelected
                                        ? 'bg-orange-50 border-orange-400 text-orange-700 ring-2 ring-orange-200'
                                        : 'bg-app-muted border-border text-primary-muted hover:border-blue-400 hover:text-blue-600'
                                        }`}
                                >
                                    <span className="text-sm">🧩</span>
                                    {id}
                                </button>

                                {isSelected && !isEditing && (
                                    <div className="absolute -top-3 -right-3 flex gap-1 z-10 animate-in fade-in zoom-in duration-200">
                                        {onModifyComponent && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingId(id); setRequirement(''); }}
                                                className="p-1.5 bg-white border border-border rounded-full shadow-sm text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                                title="Ask AI to Modify"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {onRemoveComponent && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveComponent(id); }}
                                                className="p-1.5 bg-white border border-border rounded-full shadow-sm text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                                                title="Delete Component"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Inline Editing Form */}
                {editingId && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Modifying <span className="px-1.5 py-0.5 bg-white rounded border border-blue-200 font-mono text-[10px]">{editingId}</span>
                            </span>
                            <button
                                onClick={() => setEditingId(null)}
                                className="text-blue-400 hover:text-blue-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleModifySubmit(editingId); }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={requirement}
                                onChange={(e) => setRequirement(e.target.value)}
                                placeholder="e.g. Make the button red"
                                className="flex-1 text-sm px-3 py-1.5 border border-blue-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!requirement.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check className="w-4 h-4" />
                                Submit
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
}
