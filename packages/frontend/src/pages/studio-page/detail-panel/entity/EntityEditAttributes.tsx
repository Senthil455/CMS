import { type EntityDto, type AttributeDto, type SchemaDto } from '@cms/shared';
import { FileCode, Plus, Trash2, Lock, X, GripVertical } from 'lucide-react';
import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface EntityEditAttributesProps {
    entityForm: EntityDto;
    updateAttribute: (index: number, changes: Partial<AttributeDto>) => void;
    addAttribute: () => void;
    removeAttribute: (index: number) => void;
    setAttributes: (newAttrs: AttributeDto[]) => void;
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
    ]
};

export function EntityEditAttributes({ entityForm, updateAttribute, addAttribute, removeAttribute, setAttributes, availableEntities }: EntityEditAttributesProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = entityForm.attributes.findIndex((_, idx) => `attr-${idx}` === active.id);
            const newIndex = entityForm.attributes.findIndex((_, idx) => `attr-${idx}` === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                setAttributes(arrayMove(entityForm.attributes, oldIndex, newIndex));
            }
        }
    };

    const attributeItems = entityForm.attributes.map((attr, idx) => ({
        ...attr,
        id: `attr-${idx}`, // Unique ID for dnd-kit
        originalIdx: idx
    }));

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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={attributeItems.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {attributeItems.map((item) => (
                            <SortableAttributeItem
                                key={item.id}
                                item={item}
                                originalIdx={item.originalIdx}
                                updateAttribute={updateAttribute}
                                removeAttribute={removeAttribute}
                                availableEntities={availableEntities}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </section>
    );
}

function SortableAttributeItem({
    item,
    originalIdx,
    updateAttribute,
    removeAttribute,
    availableEntities
}: {
    item: AttributeDto & { id: string };
    originalIdx: number;
    updateAttribute: (index: number, changes: Partial<AttributeDto>) => void;
    removeAttribute: (index: number) => void;
    availableEntities: SchemaDto[];
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const isSystemField = SYSTEM_FIELDS.has(item.field);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-app-surface border border-border rounded-xl shadow-sm group ${isSystemField ? 'opacity-80' : ''} ${isDragging ? 'shadow-xl scale-[1.02] border-primary ring-1 ring-primary' : ''}`}
        >
            <div className="flex items-center justify-between px-4 py-2 bg-app-muted/50 border-b border-border rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-app-muted rounded cursor-grab active:cursor-grabbing text-primary-muted/50 hover:text-primary transition-colors"
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-primary/70 font-mono">{item.field || 'unnamed_field'}</span>
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
                        value={item.field}
                        onChange={(e) => updateAttribute(originalIdx, { field: e.target.value })}
                        className="app-input-sm disabled:cursor-not-allowed disabled:bg-app-muted/50"
                        disabled={isSystemField}
                    />
                </FormField>
                <FormField label="Header / Label" small>
                    <input
                        type="text"
                        value={item.header}
                        onChange={(e) => updateAttribute(originalIdx, { header: e.target.value })}
                        className="app-input-sm"
                    />
                </FormField>
                <FormField label="Data Type" small>
                    <select
                        value={item.dataType}
                        onChange={(e) => {
                            const newDataType = e.target.value;
                            const allowedDisplayTypes = DISPLAY_TYPE_MAPPING[newDataType] || [];
                            const firstAllowed = allowedDisplayTypes[0]?.value || 'text';
                            const currentValid = allowedDisplayTypes.some(d => d.value === item.displayType);

                            updateAttribute(originalIdx, {
                                dataType: newDataType,
                                displayType: currentValid ? item.displayType : firstAllowed
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
                        value={item.displayType}
                        onChange={(e) => updateAttribute(originalIdx, { displayType: e.target.value })}
                        className="app-input-sm disabled:cursor-not-allowed disabled:bg-app-muted/50"
                        disabled={isSystemField}
                    >
                        {(DISPLAY_TYPE_MAPPING[item.dataType] || DISPLAY_TYPE_MAPPING['string'] || []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Validation" small>
                    <input
                        type="text"
                        value={item.validation || ''}
                        onChange={(e) => updateAttribute(originalIdx, { validation: e.target.value })}
                        className="app-input-sm"
                        placeholder="regex pattern"
                    />
                </FormField>
                {['lookup', 'junction', 'collection'].includes(item.dataType) ? (
                    <FormField label="Related Entity" small>
                        <select
                            value={item.options || ''}
                            onChange={(e) => updateAttribute(originalIdx, { options: e.target.value })}
                            className="app-input-sm"
                        >
                            <option value="">Select Entity...</option>
                            {availableEntities.map(e => (
                                <option key={e.schemaId} value={e.name}>{e.name}</option>
                            ))}
                        </select>
                    </FormField>
                ) : (item.displayType === 'dropdown' || (item.displayType === 'multiselect' && item.dataType === 'string')) ? (
                    <div className="md:col-span-3">
                        <DropdownOptionsManager
                            options={item.options || ''}
                            onChange={(newOptions: string) => updateAttribute(originalIdx, { options: newOptions })}
                        />
                    </div>
                ) : null}
                <div className="flex items-center gap-6 md:col-span-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={item.inList}
                            onChange={(e) => updateAttribute(originalIdx, { inList: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span className="text-xs font-medium text-primary/70">Show in List</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={item.inDetail}
                            onChange={(e) => updateAttribute(originalIdx, { inDetail: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span className="text-xs font-medium text-primary/70">Show in Detail</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, children, small = false }: { label: string; children: React.ReactNode; small?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5 h-full">
            <label className={`font-bold text-primary-muted uppercase tracking-tight ${small ? 'text-[10px]' : 'text-xs'}`}>
                {label}
            </label>
            <div className="flex-1 flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
}

function DropdownOptionsManager({ options, onChange }: { options: string; onChange: (val: string) => void }) {
    const [newValue, setNewValue] = useState('');
    const items = options ? options.split(',').map(s => s.trim()).filter(Boolean) : [];

    const handleAdd = () => {
        if (!newValue.trim()) return;
        const newItems = [...items, newValue.trim()];
        onChange(newItems.join(', '));
        setNewValue('');
    };

    const handleRemove = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems.join(', '));
    };

    return (
        <div className="space-y-2 bg-app-muted/30 p-3 rounded-xl border border-border/50">
            <label className="text-[10px] font-bold text-primary-muted uppercase tracking-tight">
                Dropdown Options (CSV)
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {items.map((item, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-app-surface text-xs font-medium text-primary border border-border rounded-lg shadow-sm group/chip"
                    >
                        {item}
                        <button
                            onClick={() => handleRemove(idx)}
                            className="p-0.5 hover:bg-red-500/10 text-primary-muted hover:text-red-500 rounded transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {items.length === 0 && (
                    <span className="text-[10px] text-primary-muted/50 italic py-1">No options defined</span>
                )}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                    placeholder="Add option..."
                    className="app-input-sm flex-1"
                />
                <button
                    onClick={handleAdd}
                    disabled={!newValue.trim()}
                    className="px-3 py-1 bg-primary text-app rounded-lg text-[10px] font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    Add
                </button>
            </div>
        </div>
    );
}
