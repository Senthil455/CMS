import { Layers, Trash2, Check, Sparkles, Code } from 'lucide-react';
import type { PageMetadata } from '@cms/shared';
import { useState } from 'react';

interface PageComponentsSectionProps {
    metadata: PageMetadata;
    schemaId: string;
    selectedComponentId: string | null;
    onSelectComponent: (id: string | null) => void;
    onRemoveComponent?: (id: string) => void;
    onChatAction?: (action: string) => void;
    onEditSource?: (id: string) => void;
}

export function PageComponentsSection({ metadata, schemaId, selectedComponentId, onSelectComponent, onRemoveComponent, onChatAction, onEditSource }: PageComponentsSectionProps) {
    const components = metadata.components;
    const [editingId, setEditingId] = useState<string | null>(null);
    const [modifyReq, setModifyReq] = useState('');

    if (!components || Object.keys(components).length === 0) return null;


    return (
        <section className="space-y-4 shrink-0">
            <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Components
                </h3>
                <span className="text-[10px] font-bold text-primary-muted">{components.length} component{components.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    {components.map(com => {
                        const id = com.id
                        const isSelected = selectedComponentId === id;

                        return (
                            <div key={com.id} className="relative flex flex-col group gap-2 border rounded-lg p-2 transition-all">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onSelectComponent(isSelected ? null : id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border flex-1 ${isSelected
                                            ? 'bg-orange-50 border-orange-400 text-orange-700 ring-1 ring-orange-200'
                                            : 'bg-app-muted border-border text-primary-muted hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🧩</span>
                                                <span>{id}</span>
                                            </div>
                                            {com.componentTypeId && (
                                                <span className="text-[9px] font-bold text-primary-muted/60 bg-app-muted px-1 rounded border border-border/50 uppercase tracking-tighter">
                                                    {com.componentTypeId}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            // Focus the component
                                            onSelectComponent(id);
                                            // We want to trigger a message to chat. The parent handles onModifyComponent.
                                            // If we just want to mention @[componentId], we can pass an empty requirement
                                            // or let the parent handle the mention.
                                            if (onChatAction) {
                                                onChatAction(`@modify-component ${schemaId} ${id} `); // The user said "put a message to the chat mention @[componentId]"
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md transition-colors border border-violet-200"
                                        title="Edit with AI"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        <span>AI Edit</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            onSelectComponent(id);
                                            if (onEditSource) {
                                                onEditSource(id);
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                                        title="Edit Source"
                                    >
                                        <Code className="w-3 h-3" />
                                        <span>Source</span>
                                    </button>

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

                                {editingId === id && onChatAction && (
                                    <div className="flex items-center gap-2 mt-1 px-1">
                                        <input
                                            type="text"
                                            value={modifyReq}
                                            onChange={e => setModifyReq(e.target.value)}
                                            placeholder="Ask AI to modify this..."
                                            className="flex-1 text-xs px-2 py-1 border border-border rounded-md focus:outline-none focus:border-blue-500"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && modifyReq.trim()) {
                                                    onChatAction(`@modify-component ${schemaId} ${id} ${modifyReq.trim()}`);
                                                    setEditingId(null);
                                                    setModifyReq('');
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                if (modifyReq.trim()) {
                                                    onChatAction(`@modify-component ${schemaId} ${id} ${modifyReq.trim()}`);
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
