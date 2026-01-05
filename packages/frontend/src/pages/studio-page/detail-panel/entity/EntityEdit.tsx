import { useState, useEffect } from 'react';
import { type SchemaDto, type SaveSchemaPayload, type EntityDto, type AttributeDto } from '@cms/shared';
import { FileCode, Save, X, Loader2 } from 'lucide-react';
import { EntityEditSettings } from './EntityEditSettings';
import { EntityEditAttributes } from './EntityEditAttributes';
import { useSchemas } from '../../../../hooks/use-schemas';

interface EntityEditProps {
    item: SchemaDto;
    initialTab?: 'settings' | 'attributes';
    onTabChange?: (tab: 'settings' | 'attributes') => void;
    onSave: (payload: SaveSchemaPayload) => Promise<void>;
    onCancel: () => void;
}

export function EntityEdit({ item, initialTab = 'attributes', onTabChange, onSave, onCancel }: EntityEditProps) {
    const { defineEntity } = useSchemas();
    const [activeTab, setActiveTab] = useState<'settings' | 'attributes'>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleTabChange = (tab: 'settings' | 'attributes') => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

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

    const [description, setDescription] = useState<string>(item.description || '');

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const payload: SaveSchemaPayload = {
                schemaId: item.schemaId,
                type: 'entity',
                description: description,
                settings: { entity: entityForm }
            };

            if (activeTab === 'attributes') {
                const fullPayload = {
                    ...item,
                    description,
                    settings: {
                        ...item.settings,
                        entity: entityForm
                    }
                };

                // Use new endpoint for attributes changes via hook
                await defineEntity(fullPayload);

                // Refresh parent data/settings if needed by calling onSave 
                // Since defineEntity does mutate(), this might be redundant for data refresh 
                // but required if onSave does props-level management
                await onSave(payload);
            } else {
                // Settings tab save
                await onSave(payload);
            }

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

    const updateAttribute = (index: number, changes: Partial<AttributeDto>) => {
        setEntityForm(prev => {
            const newAttributes = [...prev.attributes];
            newAttributes[index] = { ...newAttributes[index], ...changes };
            return { ...prev, attributes: newAttributes };
        });
    };

    const addAttribute = () => {
        const newAttr: AttributeDto = {
            field: 'new_field',
            header: 'New Field',
            dataType: 'string',
            displayType: 'text',
            inList: true,
            inDetail: true,
            isDefault: false,
            options: '',
            validation: ''
        };

        const attributes = [...entityForm.attributes];
        // Find the First "footer" system field to insert before
        const footerSystemFields = ['createdBy', 'createdAt', 'updatedAt', 'publishedAt', 'publicationStatus'];
        const insertIndex = attributes.findIndex(a => footerSystemFields.includes(a.field));

        if (insertIndex !== -1) {
            attributes.splice(insertIndex, 0, newAttr);
        } else {
            attributes.push(newAttr);
        }

        setEntityForm({ ...entityForm, attributes });
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
                            <div className="flex p-0.5 bg-app-muted rounded-lg">
                                <button
                                    onClick={() => handleTabChange('settings')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'settings'
                                        ? 'bg-app-surface text-primary shadow-sm'
                                        : 'text-primary-muted hover:text-primary'
                                        }`}
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => handleTabChange('attributes')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'attributes'
                                        ? 'bg-app-surface text-primary shadow-sm'
                                        : 'text-primary-muted hover:text-primary'
                                        }`}
                                >
                                    Attributes
                                </button>
                            </div>
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
                    {activeTab === 'settings' && (
                        <EntityEditSettings
                            entityForm={entityForm}
                            description={description}
                            updateEntityField={updateEntityField}
                            updateDescription={setDescription}
                        />
                    )}

                    {activeTab === 'attributes' && (
                        <EntityEditAttributes
                            entityForm={entityForm}
                            updateAttribute={updateAttribute}
                            addAttribute={addAttribute}
                            removeAttribute={removeAttribute}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
