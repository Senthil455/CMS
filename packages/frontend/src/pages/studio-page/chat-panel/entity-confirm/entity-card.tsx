import { PlusCircle, AlertCircle } from 'lucide-react';
import type { EntityDto, AttributeDto } from '@cms/shared';

type SchemaEntity = EntityDto & { schemaId?: string | null; };

interface EntityCardProps {
    item: SchemaEntity;
    index: number;
    isSkipped: boolean;
    onToggleSkip: (index: number) => void;
}

export function EntityCard({ item, index, isSkipped, onToggleSkip }: EntityCardProps) {
    const isNew = !item.schemaId;

    return (
        <div
            className={`p-4 rounded-xl border transition-all duration-200 ${isSkipped
                ? 'bg-app-muted/20 border-border opacity-60'
                : isNew
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {isNew ? (
                        <PlusCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <h3 className="font-bold text-base flex items-center gap-2">
                        {item.name}
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${isSkipped
                            ? 'bg-app-muted text-primary-muted'
                            : isNew
                                ? 'bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                : 'bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                            }`}>
                            {isSkipped ? 'skip' : (isNew ? 'add' : 'update')}
                        </span>
                    </h3>
                </div>
                <button
                    onClick={() => onToggleSkip(index)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${isSkipped
                        ? 'bg-primary text-app hover:opacity-90'
                        : 'bg-app-muted text-primary-muted hover:bg-app-surface border border-border'
                        }`}
                >
                    {isSkipped ? 'Include' : 'Skip'}
                </button>
            </div>

            {!isSkipped && (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pb-2 border-b border-black/5 dark:border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">Display Name</span>
                            <span className="text-xs font-medium">{item.displayName}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">Table</span>
                            <span className="text-xs font-mono">{item.tableName}</span>
                        </div>
                        {item.schemaId && (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">ID</span>
                                <span className="text-xs font-mono">{item.schemaId}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-primary-muted uppercase tracking-widest opacity-60">Attributes</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-app-muted/50 border-b border-border">
                                        <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Field</th>
                                        <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Header</th>
                                        <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Data Type</th>
                                        <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Display</th>
                                        <th className="text-center px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">List</th>
                                        <th className="text-center px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Detail</th>
                                        <th className="text-center px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Default</th>
                                        <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Options</th>
                                        <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide text-primary-muted">Validation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item?.attributes?.map((attr: AttributeDto, idx: number) => (
                                        <tr key={idx} className="border-b border-border/50 hover:bg-app-muted/30 transition-colors">
                                            <td className="px-2 py-2 font-bold text-primary">{attr.field}</td>
                                            <td className="px-2 py-2">{attr.header}</td>
                                            <td className="px-2 py-2 font-mono text-primary">{attr.dataType}</td>
                                            <td className="px-2 py-2 font-mono">{attr.displayType}</td>
                                            <td className="px-2 py-2 text-center">
                                                <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold ${attr.inList ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {attr.inList ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold ${attr.inDetail ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {attr.inDetail ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold ${attr.isDefault ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {attr.isDefault ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 font-mono text-[10px] max-w-[120px] truncate" title={attr.options}>{attr.options || '-'}</td>
                                            <td className="px-2 py-2 font-mono text-[10px] max-w-[150px] truncate" title={attr.validation}>{attr.validation || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
