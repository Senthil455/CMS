import { useState, useRef, useEffect } from 'react';
import { PlusCircle, AlertCircle, Pencil, Check, X } from 'lucide-react';
import type { EntityDto, AttributeDto } from '@cms/shared';

type SchemaEntity = EntityDto & { schemaId?: string | null; };

const DATA_TYPES = [
    { value: 'int', label: 'Int' },
    { value: 'datetime', label: 'Datetime' },
    { value: 'text', label: 'Text' },
    { value: 'string', label: 'String' },
    { value: 'lookup', label: 'Lookup' },
    { value: 'junction', label: 'Junction' },
    { value: 'collection', label: 'Collection' },
];

const DISPLAY_TYPE_MAPPING: Record<string, { value: string; label: string }[]> = {
    int: [{ value: 'number', label: 'Number' }],
    datetime: [
        { value: 'date', label: 'Date' },
        { value: 'datetime', label: 'Datetime' },
        { value: 'localdatetime', label: 'LocalDatetime' },
    ],
    text: [
        { value: 'textarea', label: 'Textarea' },
        { value: 'editor', label: 'Editor' },
    ],
    string: [
        { value: 'text', label: 'Text' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'multiselect', label: 'Multiselect' },
        { value: 'image', label: 'Image' },
        { value: 'file', label: 'File' },
    ],
    lookup: [
        { value: 'lookup', label: 'Lookup' },
        { value: 'treeselect', label: 'TreeSelect' },
    ],
    junction: [
        { value: 'multiselect', label: 'Multiselect' },
        { value: 'picklist', label: 'Picklist' },
        { value: 'tree', label: 'Tree' },
    ],
    collection: [
        { value: 'gallery', label: 'Gallery' },
        { value: 'edittable', label: 'EditTable' },
        { value: 'dictionary', label: 'Dictionary' },
    ],
};

interface EntityCardProps {
    item: SchemaEntity;
    index: number;
    isSkipped: boolean;
    onToggleSkip: (index: number) => void;
    onUpdate?: (index: number, updated: SchemaEntity) => void;
}

// A small reusable inline-edit cell
function InlineEditCell({
    value,
    className,
    onSave,
}: {
    value: string;
    className?: string;
    onSave: (v: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) {
            setDraft(value);
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing, value]);

    const commit = () => {
        onSave(draft);
        setEditing(false);
    };

    const cancel = () => {
        setDraft(value);
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="flex items-center gap-1 min-w-[80px]">
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commit();
                        if (e.key === 'Escape') cancel();
                    }}
                    className={`bg-app border border-primary/30 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary/50 w-full ${className ?? ''}`}
                />
                <button onClick={commit} className="text-green-600 hover:text-green-500 flex-shrink-0" title="Save">
                    <Check className="w-3 h-3" />
                </button>
                <button onClick={cancel} className="text-red-500 hover:text-red-400 flex-shrink-0" title="Cancel">
                    <X className="w-3 h-3" />
                </button>
            </div>
        );
    }

    return (
        <span
            className={`group/cell inline-flex items-center gap-1 cursor-pointer rounded px-0.5 hover:bg-primary/5 transition-colors ${className ?? ''}`}
            onClick={() => setEditing(true)}
            title="Click to edit"
        >
            {value || <span className="opacity-40 italic">—</span>}
            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/cell:opacity-40 transition-opacity flex-shrink-0" />
        </span>
    );
}

// Toggle-cell for boolean attributes
function ToggleCell({ value, onSave }: { value: boolean; onSave: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onSave(!value)}
            className={`inline-block w-12 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer hover:opacity-80 ${value
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
            title="Click to toggle"
        >
            {value ? 'Yes' : 'No'}
        </button>
    );
}

export function EntityCard({ item, index, isSkipped, onToggleSkip, onUpdate }: EntityCardProps) {
    const isNew = !item.schemaId;

    const updateEntity = (patch: Partial<SchemaEntity>) => {
        onUpdate?.(index, { ...item, ...patch });
    };

    const updateAttr = (attrIdx: number, patch: Partial<AttributeDto>) => {
        const newAttrs = item.attributes.map((a, i) => i === attrIdx ? { ...a, ...patch } : a);
        onUpdate?.(index, { ...item, attributes: newAttrs });
    };

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
                        <PlusCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    )}
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <InlineEditCell
                            value={item.name}
                            className="font-bold text-base"
                            onSave={(v) => updateEntity({ name: v })}
                        />
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
                            <InlineEditCell
                                value={item.displayName}
                                className="text-xs font-medium"
                                onSave={(v) => updateEntity({ displayName: v })}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-primary-muted uppercase font-bold tracking-tight opacity-50">Table</span>
                            <InlineEditCell
                                value={item.tableName}
                                className="text-xs font-mono"
                                onSave={(v) => updateEntity({ tableName: v })}
                            />
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
                                            <td className="px-2 py-2 font-bold text-primary">
                                                <InlineEditCell
                                                    value={attr.field}
                                                    className="font-bold text-primary"
                                                    onSave={(v) => updateAttr(idx, { field: v })}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <InlineEditCell
                                                    value={attr.header}
                                                    onSave={(v) => updateAttr(idx, { header: v })}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={attr.dataType}
                                                    onChange={(e) => {
                                                        const newDataType = e.target.value;
                                                        const allowed = DISPLAY_TYPE_MAPPING[newDataType] || [];
                                                        const currentValid = allowed.some(d => d.value === attr.displayType);
                                                        updateAttr(idx, {
                                                            dataType: newDataType,
                                                            displayType: currentValid ? attr.displayType : (allowed[0]?.value || 'text'),
                                                        });
                                                    }}
                                                    className="bg-app border border-primary/20 rounded px-1 py-0.5 text-xs font-mono text-primary outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                                                >
                                                    {DATA_TYPES.map(dt => (
                                                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={attr.displayType}
                                                    onChange={(e) => updateAttr(idx, { displayType: e.target.value })}
                                                    className="bg-app border border-primary/20 rounded px-1 py-0.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                                                >
                                                    {(DISPLAY_TYPE_MAPPING[attr.dataType] || DISPLAY_TYPE_MAPPING['string'] || []).map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <ToggleCell value={attr.inList} onSave={(v) => updateAttr(idx, { inList: v })} />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <ToggleCell value={attr.inDetail} onSave={(v) => updateAttr(idx, { inDetail: v })} />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <ToggleCell value={attr.isDefault} onSave={(v) => updateAttr(idx, { isDefault: v })} />
                                            </td>
                                            <td className="px-2 py-2 font-mono text-[10px] max-w-[120px]" title={attr.options}>
                                                <InlineEditCell
                                                    value={attr.options || ''}
                                                    className="font-mono text-[10px] max-w-[120px] truncate"
                                                    onSave={(v) => updateAttr(idx, { options: v })}
                                                />
                                            </td>
                                            <td className="px-2 py-2 font-mono text-[10px] max-w-[150px]" title={attr.validation}>
                                                <InlineEditCell
                                                    value={attr.validation || ''}
                                                    className="font-mono text-[10px] max-w-[150px] truncate"
                                                    onSave={(v) => updateAttr(idx, { validation: v })}
                                                />
                                            </td>
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
