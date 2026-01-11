import { type EntityDto, type AttributeDto, type SchemaDto } from '@cms/shared';
import { FileCode, Plus, Trash2, Lock } from 'lucide-react';

interface EntityEditAttributesProps {
    entityForm: EntityDto;
    updateAttribute: (index: number, changes: Partial<AttributeDto>) => void;
    addAttribute: () => void;
    removeAttribute: (index: number) => void;
    availableEntities: SchemaDto[];
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

const DISPLAY_TYPE_MAPPING: Record<string, { value: string; label: string }[]> = {
    int: [
        { value: 'number', label: 'Number' },
    ],
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
    ]
};

export function EntityEditAttributes({ entityForm, updateAttribute, addAttribute, removeAttribute, availableEntities }: EntityEditAttributesProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Attributes
                </h3>
                <button
                    onClick={addAttribute}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Attribute
                </button>
            </div>

            <div className="space-y-4">
                {entityForm.attributes
                    .map((attr, originalIdx) => ({ attr, originalIdx }))
                    .sort((a, b) => {
                        if (a.attr.field === 'id') return -1;
                        if (b.attr.field === 'id') return 1;
                        const isASystem = SYSTEM_FIELDS.has(a.attr.field);
                        const isBSystem = SYSTEM_FIELDS.has(b.attr.field);
                        if (isASystem && !isBSystem) return 1;
                        if (!isASystem && isBSystem) return -1;
                        return 0;
                    })
                    .map(({ attr, originalIdx }) => {
                        const isSystemField = SYSTEM_FIELDS.has(attr.field);
                        return (
                            <div key={originalIdx} className={`bg-app-surface border border-border rounded-xl shadow-sm group ${isSystemField ? 'opacity-80' : ''}`}>
                                <div className="flex items-center justify-between px-4 py-2 bg-app-muted/50 border-b border-border rounded-t-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-primary/70 font-mono">{attr.field || 'unnamed_field'}</span>
                                        {isSystemField && (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-app-muted text-[10px] font-bold text-primary-muted rounded border border-border uppercase tracking-wider">
                                                <Lock className="w-2.5 h-2.5" />
                                                System
                                            </span>
                                        )}
                                    </div>
                                    {!isSystemField && (
                                        <button
                                            onClick={() => removeAttribute(originalIdx)}
                                            className="p-1.5 bg-app-muted text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                                            title="Remove Attribute"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField label="Field Key" small>
                                        <input
                                            type="text"
                                            value={attr.field}
                                            onChange={(e) => updateAttribute(originalIdx, { field: e.target.value })}
                                            className="app-input-sm disabled:cursor-not-allowed disabled:bg-app-muted/50"
                                            disabled={isSystemField}
                                        />
                                    </FormField>
                                    <FormField label="Header / Label" small>
                                        <input
                                            type="text"
                                            value={attr.header}
                                            onChange={(e) => updateAttribute(originalIdx, { header: e.target.value })}
                                            className="app-input-sm"
                                        />
                                    </FormField>
                                    <FormField label="Data Type" small>
                                        <select
                                            value={attr.dataType}
                                            onChange={(e) => {
                                                const newDataType = e.target.value;
                                                const allowedDisplayTypes = DISPLAY_TYPE_MAPPING[newDataType] || [];
                                                const firstAllowed = allowedDisplayTypes[0]?.value || 'text';
                                                const currentValid = allowedDisplayTypes.some(d => d.value === attr.displayType);

                                                updateAttribute(originalIdx, {
                                                    dataType: newDataType,
                                                    displayType: currentValid ? attr.displayType : firstAllowed
                                                });
                                            }}
                                            className="app-input-sm disabled:cursor-not-allowed disabled:bg-app-muted/50"
                                            disabled={isSystemField}
                                        >
                                            <option value="int">Int</option>
                                            <option value="datetime">Datetime</option>
                                            <option value="text">Text</option>
                                            <option value="string">String</option>
                                            <option value="lookup">Lookup</option>
                                            <option value="junction">Junction</option>
                                            <option value="collection">Collection</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Display Type" small>
                                        <select
                                            value={attr.displayType}
                                            onChange={(e) => updateAttribute(originalIdx, { displayType: e.target.value })}
                                            className="app-input-sm disabled:cursor-not-allowed disabled:bg-app-muted/50"
                                            disabled={isSystemField}
                                        >
                                            {(DISPLAY_TYPE_MAPPING[attr.dataType] || DISPLAY_TYPE_MAPPING['string'] || []).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Validation" small>
                                        <input
                                            type="text"
                                            value={attr.validation || ''}
                                            onChange={(e) => updateAttribute(originalIdx, { validation: e.target.value })}
                                            className="app-input-sm"
                                            placeholder="regex pattern"
                                        />
                                    </FormField>
                                    {attr.dataType === 'lookup' && (
                                        <FormField label="Lookup Entity" small>
                                            <select
                                                value={attr.options || ''}
                                                onChange={(e) => updateAttribute(originalIdx, { options: e.target.value })}
                                                className="app-input-sm"
                                            >
                                                <option value="">Select Entity...</option>
                                                {availableEntities.map(e => (
                                                    <option key={e.schemaId} value={e.name}>{e.name}</option>
                                                ))}
                                            </select>
                                        </FormField>
                                    )}
                                    <div className="flex items-center gap-6 md:col-span-2 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={attr.inList}
                                                onChange={(e) => updateAttribute(originalIdx, { inList: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                            />
                                            <span className="text-xs font-medium text-primary/70">Show in List</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={attr.inDetail}
                                                onChange={(e) => updateAttribute(originalIdx, { inDetail: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                            />
                                            <span className="text-xs font-medium text-primary/70">Show in Detail</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </section>
    );
}

function FormField({ label, children, small = false }: { label: string; children: React.ReactNode; small?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className={`font-bold text-primary-muted uppercase tracking-tight ${small ? 'text-[10px]' : 'text-xs'}`}>
                {label}
            </label>
            {children}
        </div>
    );
}
