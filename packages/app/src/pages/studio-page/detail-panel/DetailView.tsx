import { type SchemaDto } from '@cms/shared';
import { Layout, AlertTriangle, Trash2 } from 'lucide-react';

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
    onEdit: (tab?: 'settings' | 'code' | 'layout' | 'view-html') => void;
    onDelete: () => void;
    onSelect: (item: SchemaDto) => void;
    onChatAction: (action: string) => void;
}

export function DetailView({ item, schemas, onEdit, onDelete, onSelect, onChatAction }: DetailViewProps) {

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

    // Fallback for schemas with null/missing settings
    if (!item.settings) {
        return (
            <div className="flex-1 flex flex-col h-full bg-app overflow-hidden">
                <div className="flex-none p-4 border-b border-border bg-app-surface">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-primary">{item.name}</h2>
                                <p className="text-[10px] text-primary-muted uppercase tracking-wider">{item.type}</p>
                            </div>
                        </div>
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-8 max-w-md text-center space-y-3">
                        <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto" />
                        <h3 className="text-sm font-bold text-primary">Missing Configuration</h3>
                        <p className="text-xs text-primary-muted leading-relaxed">
                            This {item.type} (<strong>{item.name}</strong>) has no settings data.
                            It may have been created incorrectly or its data is corrupted.
                            You can safely delete it and recreate it.
                        </p>
                    </div>
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
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onChatAction={onChatAction}
                />
            )}

            {item.type === 'query' && item.settings?.query && (
                <QueryHeader
                    query={item.settings?.query!}
                    schemaId={item.schemaId}
                    publicationStatus={item.publicationStatus}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onChatAction={onChatAction}
                />
            )}

            {item.type === 'page' && item.settings?.page && (
                <PageHeader
                    page={item.settings?.page!}
                    schemaId={item.schemaId}
                    publicationStatus={item.publicationStatus}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onChatAction={onChatAction}
                />
            )}

            <div className={`flex-1 overflow-auto p-6 ${item.type === 'query' ? 'flex flex-col' : ''}`}>
                <div className={`space-y-8 ${item.type === 'page' ? 'w-full' : 'max-w-5xl'} ${item.type === 'query' ? 'flex-1 h-full' : ''}`}>
                    {item.type === 'entity' && entity && (
                        <EntityDetail schema={item} allSchemas={schemas} />
                    )}

                    {item.type === 'query' && item.settings?.query && (
                        <QueryDetail schema={item} />
                    )}

                    {item.type === 'page' && item.settings?.page && (
                        <PageDetail schema={item} />
                    )}

                    {item.type !== 'entity' && item.type !== 'query' && item.type !== 'page' && (
                        <div className="bg-app-surface/50 border border-border rounded-xl p-10 flex flex-col items-center justify-center text-primary-muted">
                            <Layout className="w-10 h-10 mb-4 opacity-20" />
                            <p className="font-medium">Preview not yet available for {item.type}s</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
