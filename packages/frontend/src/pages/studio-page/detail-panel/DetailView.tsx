import { useState } from 'react';
import { type SchemaDto } from '@cms/shared';
import { FileCode, Info, Edit2, Layout, Code2, Database, Table } from 'lucide-react';

interface DetailViewProps {
    item: SchemaDto | null;
    onEdit: () => void;
}

export function DetailView({ item, onEdit }: DetailViewProps) {
    const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview');

    if (!item) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-primary-muted bg-app/50">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select an item from the explorer to view details</p>
                <p className="text-sm opacity-60 mt-1">You can explore entities, queries, and pages defined in CMS</p>
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
                            <>
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        General Settings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DetailItem label="Display Name" value={entity.displayName} />
                                        <DetailItem label="Table Name" value={entity.tableName} />
                                        <DetailItem label="Primary Key" value={entity.primaryKey} />
                                        <DetailItem label="Label Attribute" value={entity.labelAttributeName} />
                                        <DetailItem label="Page Size" value={entity.defaultPageSize.toString()} />
                                        <DetailItem label="Publication" value={entity.defaultPublicationStatus} />
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                                        <Table className="w-4 h-4" />
                                        Attributes
                                    </h3>
                                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-app-muted/50 text-[10px] font-bold text-primary-muted uppercase tracking-wider">
                                                    <th className="px-4 py-3 border-b border-border">Field</th>
                                                    <th className="px-4 py-3 border-b border-border">Header</th>
                                                    <th className="px-4 py-3 border-b border-border">Data Type</th>
                                                    <th className="px-4 py-3 border-b border-border">Display Type</th>
                                                    <th className="px-4 py-3 border-b border-border">Visibility</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-app-surface">
                                                {entity.attributes.map((attr, idx) => (
                                                    <tr key={idx} className="hover:bg-app-muted/20 transition-colors">
                                                        <td className="px-4 py-3 text-xs font-mono font-medium text-primary">{attr.field}</td>
                                                        <td className="px-4 py-3 text-xs text-primary-muted">{attr.header}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-1.5 py-0.5 bg-primary/5 text-primary-muted border border-primary/10 rounded text-[10px] uppercase font-bold">
                                                                {attr.dataType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-primary-muted">{attr.displayType}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                {attr.inList && <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase">List</span>}
                                                                {attr.inDetail && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Detail</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </>
                        )}

                        {item.type !== 'entity' && (
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

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">{label}</span>
            <div className="text-sm font-medium text-primary px-3 py-1.5 bg-app-surface border border-border rounded-lg shadow-sm">
                {value}
            </div>
        </div>
    );
}
