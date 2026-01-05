import { type EntityDto } from '@cms/shared';
import { Info } from 'lucide-react';

interface EntityEditSettingsProps {
    entityForm: EntityDto;
    description?: string;
    updateEntityField: (field: keyof EntityDto, value: any) => void;
    updateDescription: (value: string) => void;
}

export function EntityEditSettings({ entityForm, description, updateEntityField, updateDescription }: EntityEditSettingsProps) {
    return (
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
                <div className="md:col-span-2">
                    <FormField label="Description">
                        <textarea
                            value={description || ''}
                            onChange={(e) => updateDescription(e.target.value)}
                            className="app-input min-h-[100px]"
                            placeholder="Describe this entity..."
                        />
                    </FormField>
                </div>
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
