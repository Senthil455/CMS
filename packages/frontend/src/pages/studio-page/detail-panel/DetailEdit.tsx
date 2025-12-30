import { useState } from 'react';
import { type SchemaDto, type SaveEntityPayload, type EntityDto, type AttributeDto } from '@cms/shared';
import { FileCode, Info, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';

interface DetailEditProps {
    item: SchemaDto;
    onSave: (payload: SaveEntityPayload) => Promise<void>;
    onCancel: () => void;
}

export function DetailEdit({ item, onSave, onCancel }: DetailEditProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [entityForm, setEntityForm] = useState<EntityDto>(() => {
        return JSON.parse(JSON.stringify(item.settings.entity || {
            name: item.name,
            displayName: item.name,
            tableName: item.name.toLowerCase(),
            primaryKey: 'id',
            labelAttributeName: 'name',
            defaultPageSize: 10,
            defaultPublicationStatus: 'draft',
            pageUrl: '',
            attributes: []
        }));
    });

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const payload: SaveEntityPayload = {
                schemaId: item.schemaId,
                type: 'entity',
                settings: {
                    entity: entityForm
                }
            };

            await onSave(payload);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateEntityField = (field: keyof EntityDto, value: any) => {
        setEntityForm({ ...entityForm, [field]: value });
    };

    const updateAttribute = (index: number, field: keyof AttributeDto, value: any) => {
        const newAttributes = [...entityForm.attributes];
        newAttributes[index] = { ...newAttributes[index], [field]: value };
        setEntityForm({ ...entityForm, attributes: newAttributes });
    };

    const addAttribute = () => {
        const newAttr: AttributeDto = {
            field: 'new_field',
            header: 'New Field',
            dataType: 'varchar',
            displayType: 'text',
            inList: true,
            inDetail: true,
            isDefault: false,
            options: '',
            validation: ''
        };
        setEntityForm({ ...entityForm, attributes: [...entityForm.attributes, newAttr] });
    };

    const removeAttribute = (index: number) => {
        const newAttributes = entityForm.attributes.filter((_, i) => i !== index);
        setEntityForm({ ...entityForm, attributes: newAttributes });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-app overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-app-surface shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Editing {item.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-app-muted rounded-full text-primary-muted font-medium uppercase tracking-wider">
                                {item.type}
                            </span>
                            <span className="text-xs text-primary-muted font-mono">{item.schemaId}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 bg-app-muted hover:bg-border rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-app hover:opacity-90 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-8 max-w-4xl">
                    {/* General Settings */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            General Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Display Name">
                                <input
                                    type="text"
                                    value={entityForm.displayName}
                                    onChange={(e) => updateEntityField('displayName', e.target.value)}
                                    className="app-input"
                                />
                            </FormField>
                            <FormField label="Table Name">
                                <input
                                    type="text"
                                    value={entityForm.tableName}
                                    onChange={(e) => updateEntityField('tableName', e.target.value)}
                                    className="app-input"
                                />
                            </FormField>
                            <FormField label="Primary Key">
                                <input
                                    type="text"
                                    value={entityForm.primaryKey}
                                    onChange={(e) => updateEntityField('primaryKey', e.target.value)}
                                    className="app-input"
                                />
                            </FormField>
                            <FormField label="Label Attribute">
                                <input
                                    type="text"
                                    value={entityForm.labelAttributeName}
                                    onChange={(e) => updateEntityField('labelAttributeName', e.target.value)}
                                    className="app-input"
                                />
                            </FormField>
                            <FormField label="Default Page Size">
                                <input
                                    type="number"
                                    value={entityForm.defaultPageSize}
                                    onChange={(e) => updateEntityField('defaultPageSize', parseInt(e.target.value))}
                                    className="app-input"
                                />
                            </FormField>
                            <FormField label="Publication Status">
                                <select
                                    value={entityForm.defaultPublicationStatus}
                                    onChange={(e) => updateEntityField('defaultPublicationStatus', e.target.value)}
                                    className="app-input"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </FormField>
                        </div>
                    </section>

                    {/* Attributes */}
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
                                Add Field
                            </button>
                        </div>

                        <div className="space-y-4">
                            {entityForm.attributes.map((attr, idx) => (
                                <div key={idx} className="bg-app-surface border border-border rounded-xl shadow-sm group">
                                    <div className="flex items-center justify-between px-4 py-2 bg-app-muted/50 border-b border-border rounded-t-xl">
                                        <span className="text-xs font-bold text-primary/70 font-mono">{attr.field || 'unnamed_field'}</span>
                                        <button
                                            onClick={() => removeAttribute(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField label="Field Key" small>
                                            <input
                                                type="text"
                                                value={attr.field}
                                                onChange={(e) => updateAttribute(idx, 'field', e.target.value)}
                                                className="app-input-sm"
                                            />
                                        </FormField>
                                        <FormField label="Header / Label" small>
                                            <input
                                                type="text"
                                                value={attr.header}
                                                onChange={(e) => updateAttribute(idx, 'header', e.target.value)}
                                                className="app-input-sm"
                                            />
                                        </FormField>
                                        <FormField label="Data Type" small>
                                            <select
                                                value={attr.dataType}
                                                onChange={(e) => updateAttribute(idx, 'dataType', e.target.value)}
                                                className="app-input-sm"
                                            >
                                                <option value="varchar">Varchar (String)</option>
                                                <option value="text">Text (Long String)</option>
                                                <option value="int">Integer</option>
                                                <option value="decimal">Decimal</option>
                                                <option value="datetime">Datetime</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="json">JSON</option>
                                            </select>
                                        </FormField>
                                        <FormField label="Display Type" small>
                                            <select
                                                value={attr.displayType}
                                                onChange={(e) => updateAttribute(idx, 'displayType', e.target.value)}
                                                className="app-input-sm"
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="textarea">Textarea</option>
                                                <option value="richText">Rich Text</option>
                                                <option value="select">Select</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="datepicker">Date Picker</option>
                                                <option value="image">Image</option>
                                                <option value="file">File</option>
                                            </select>
                                        </FormField>
                                        <div className="flex items-center gap-6 md:col-span-2 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={attr.inList}
                                                    onChange={(e) => updateAttribute(idx, 'inList', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                                />
                                                <span className="text-xs font-medium text-primary/70">Show in List</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={attr.inDetail}
                                                    onChange={(e) => updateAttribute(idx, 'inDetail', e.target.checked)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                                />
                                                <span className="text-xs font-medium text-primary/70">Show in Detail</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
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
