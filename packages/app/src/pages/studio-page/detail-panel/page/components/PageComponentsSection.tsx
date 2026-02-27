import { Layers, Trash2, Edit2, Check } from 'lucide-react';
import type { PageMetadata } from '@cms/shared';
import { useState } from 'react';

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
    const [modifyReq, setModifyReq] = useState('');

    if (!components || Object.keys(components).length === 0) return null;

    const componentIds = Object.keys(components);

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

                        return (
                            <div key={id} className="relative flex flex-col group gap-2 border rounded-lg p-2 transition-all">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onSelectComponent(isSelected ? null : id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border flex-1 ${isSelected
                                            ? 'bg-orange-50 border-orange-400 text-orange-700 ring-1 ring-orange-200'
                                            : 'bg-app-muted border-border text-primary-muted hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                    >
                                        <span className="text-sm">🧩</span>
                                        {id}
                                    </button>

                                    {onModifyComponent && (
                                        <button
                                            onClick={() => {
                                                if (editingId === id) {
                                                    setEditingId(null);
                                                    setModifyReq('');
                                                } else {
                                                    setEditingId(id);
                                                    setModifyReq('');
                                                }
                                            }}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Ask AI to Modify"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    {onRemoveComponent && (
                                        <button
                                            onClick={() => onRemoveComponent(id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete Component"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {editingId === id && onModifyComponent && (
                                    <div className="flex items-center gap-2 mt-1 px-1">
                                        <input
                                            type="text"
                                            value={modifyReq}
                                            onChange={e => setModifyReq(e.target.value)}
                                            placeholder="Ask AI to modify this..."
                                            className="flex-1 text-xs px-2 py-1 border border-border rounded-md focus:outline-none focus:border-blue-500"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && modifyReq.trim()) {
                                                    onModifyComponent(id, modifyReq.trim());
                                                    setEditingId(null);
                                                    setModifyReq('');
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                if (modifyReq.trim()) {
                                                    onModifyComponent(id, modifyReq.trim());
                                                    setEditingId(null);
                                                    setModifyReq('');
                                                }
                                            }}
                                            disabled={!modifyReq.trim()}
                                            className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
