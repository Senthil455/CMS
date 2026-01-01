import { useState } from 'react';
import { type SchemaDto } from '@cms/shared';
import { FileCode, Info, Edit2, Layout, Code2 } from 'lucide-react';

import { SchemaGraph } from './SchemaGraph';
import { EntityDetail } from './EntityDetail';
import { QueryDetail } from './QueryDetail';

interface DetailViewProps {
    item: SchemaDto | null;
    schemas: SchemaDto[];
    onEdit: () => void;
    onSelect: (item: SchemaDto) => void;
}

export function DetailView({ item, schemas, onEdit, onSelect }: DetailViewProps) {
    const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview');

    if (!item) {
        return (
            <div className="flex-1 flex flex-col h-full bg-app">
                <div className="flex-none p-4 border-b border-border bg-app-surface text-center">
                    <h2 className="text-sm font-bold text-primary-muted uppercase tracking-wider">System Overview</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SchemaGraph
                        schemas={schemas}
                        onNodeClick={(schemaId) => {
                            const found = schemas.find(s => s.schemaId === schemaId);
                            if (found) onSelect(found);
                        }}
                    />
                </div>
            </div>
        );
    }

    const entity = item.settings.entity;

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

                <div className="flex items-center gap-3">
                    <div className="flex bg-app-muted p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            Preview
                        </button>
                        <button
                            onClick={() => setViewMode('json')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'json' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                        >
                            <Code2 className="w-3.5 h-3.5" />
                            JSON
                        </button>
                    </div>

                    {item.type === 'entity' && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-app hover:opacity-90 rounded-lg text-xs font-bold transition-all shadow-md"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Entity
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {viewMode === 'json' ? (
                    <div className="bg-app-surface/50 border border-border rounded-xl p-6 shadow-inner">
                        <pre className="font-mono text-sm text-primary/90 leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(item.settings, null, 4)}
                        </pre>
                    </div>
                ) : (
                    <div className="space-y-8 max-w-5xl">
                        {item.type === 'entity' && entity && (
                            <EntityDetail entity={entity} />
                        )}

                        {item.type === 'query' && item.settings.query && (
                            <QueryDetail query={item.settings.query} />
                        )}

                        {item.type !== 'entity' && item.type !== 'query' && (
                            <div className="bg-app-surface/50 border border-border rounded-xl p-10 flex flex-col items-center justify-center text-primary-muted">
                                <Layout className="w-10 h-10 mb-4 opacity-20" />
                                <p className="font-medium">Preview not yet available for {item.type}s</p>
                                <button
                                    onClick={() => setViewMode('json')}
                                    className="mt-4 text-xs font-bold text-primary hover:underline"
                                >
                                    Switch to JSON View
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
