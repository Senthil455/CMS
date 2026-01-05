import { type EntityDto } from '@cms/shared';
import { Database, Table, Lock } from 'lucide-react';

interface EntityDetailProps {
    entity: EntityDto;
    description?: string;
}

const SYSTEM_FIELDS = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'updateAt',
    'createdBy',
    'publishedAt',
    'publicationStatus'
]);

export function EntityDetail({ entity, description }: EntityDetailProps) {
    return (
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
                    {description && (
                        <div className="md:col-span-3">
                            <DetailItem label="Description" value={description} multiline />
                        </div>
                    )}
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
                            {entity.attributes.map((attr, idx) => {
                                const isSystem = SYSTEM_FIELDS.has(attr.field);
                                return (
                                    <tr
                                        key={idx}
                                        className={`transition-colors ${isSystem ? 'bg-app-muted/30 hover:bg-app-muted/50' : 'hover:bg-app-muted/20'}`}
                                    >
                                        <td className="px-4 py-3 text-xs font-mono font-medium text-primary">
                                            <div className="flex items-center gap-2">
                                                {attr.field}
                                                {isSystem && <Lock className="w-3 h-3 text-primary-muted" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-primary-muted">{attr.header}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-1.5 py-0.5 border rounded text-[10px] uppercase font-bold ${isSystem
                                                    ? 'bg-app-muted text-primary-muted border-border'
                                                    : 'bg-primary/5 text-primary-muted border-primary/10'
                                                }`}>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

function DetailItem({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">{label}</span>
            <div className={`text-sm font-medium text-primary px-3 py-1.5 bg-app-surface border border-border rounded-lg shadow-sm ${multiline ? 'whitespace-pre-wrap min-h-[60px]' : ''}`}>
                {value}
            </div>
        </div>
    );
}
