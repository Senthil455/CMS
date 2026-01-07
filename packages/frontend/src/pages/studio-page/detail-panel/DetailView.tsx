import { useState } from 'react';
import { type SchemaDto } from '@cms/shared';
import { Layout } from 'lucide-react';

import { SchemaGraph } from './SchemaGraph';
import { EntityDetail } from './entity/EntityDetail';
import { QueryDetail } from './query/QueryDetail';
import { PageDetail } from './page/PageDetail';
import { EntityHeader } from './headers/EntityHeader';
import { QueryHeader } from './headers/QueryHeader';
import { PageHeader } from './headers/PageHeader';

interface DetailViewProps {
    item: SchemaDto | null;
    schemas: SchemaDto[];
    onEdit: (tab?: 'settings' | 'code') => void;
    onDelete: () => void;
    onSelect: (item: SchemaDto) => void;
}

export function DetailView({ item, schemas, onEdit, onDelete, onSelect }: DetailViewProps) {

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
            {item.type === 'entity' && entity && (
                <EntityHeader
                    entity={entity}
                    schemaId={item.schemaId}
                    publicationStatus={item.publicationStatus}
                    isLatest={item.isLatest}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            )}

            {item.type === 'query' && item.settings.query && (
                <QueryHeader
                    query={item.settings.query}
                    schemaId={item.schemaId}
                    publicationStatus={item.publicationStatus}
                    isLatest={item.isLatest}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            )}

            {item.type === 'page' && item.settings.page && (
                <PageHeader
                    page={item.settings.page}
                    schemaId={item.schemaId}
                    publicationStatus={item.publicationStatus}
                    isLatest={item.isLatest}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            )}

            <div className={`flex-1 overflow-auto p-6 ${item.type === 'query' ? 'flex flex-col' : ''}`}>
                {viewMode === 'json' ? (
                    <div className="bg-app-surface/50 border border-border rounded-xl p-6 shadow-inner">
                        <pre className="font-mono text-sm text-primary/90 leading-relaxed whitespace-pre-wrap">
                            {JSON.stringify(item.settings, null, 4)}
                        </pre>
                    </div>
                ) : (
                    <div className={`space-y-8 max-w-5xl ${item.type === 'query' ? 'flex-1 h-full' : ''}`}>
                        {item.type === 'entity' && entity && (
                            <EntityDetail entity={entity} description={item.description} />
                        )}

                        {item.type === 'query' && item.settings.query && (
                            <QueryDetail query={item.settings.query} />
                        )}

                        {item.type === 'page' && item.settings.page && (
                            <PageDetail page={item.settings.page} />
                        )}

                        {item.type !== 'entity' && item.type !== 'query' && item.type !== 'page' && (
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
