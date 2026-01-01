import { useState } from 'react';
import { type SchemaDto, type SaveSchemaPayload, type QueryDto } from '@cms/shared';
import { FileCode, Info, Save, X, Loader2, Database } from 'lucide-react';

interface QueryEditProps {
    item: SchemaDto;
    onSave: (payload: SaveSchemaPayload) => Promise<void>;
    onCancel: () => void;
}

export function QueryEdit({ item, onSave, onCancel }: QueryEditProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [queryForm, setQueryForm] = useState<QueryDto>(() => {
        return JSON.parse(JSON.stringify(item.settings.query || {
            name: item.name,
            entityName: '',
            source: 'model',
            filters: [],
            sorts: [],
            reqVariables: [],
            distinct: false,
            ideUrl: '',
            pagination: { offset: '0', limit: '10' }
        }));
    });

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const payload: SaveSchemaPayload = {
                schemaId: item.schemaId,
                type: 'query',
                settings: {
                    query: queryForm
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

    const updateField = (field: keyof QueryDto, value: any) => {
        setQueryForm({ ...queryForm, [field]: value });
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
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Query Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Entity Name">
                                <input
                                    type="text"
                                    value={queryForm.entityName}
                                    onChange={(e) => updateField('entityName', e.target.value)}
                                    className="app-input"
                                />
                            </FormField>
                            <FormField label="Source">
                                <select
                                    value={queryForm.source}
                                    onChange={(e) => updateField('source', e.target.value)}
                                    className="app-input"
                                >
                                    <option value="model">Model</option>
                                    <option value="sql">SQL (Raw)</option>
                                    <option value="api">API</option>
                                </select>
                            </FormField>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={queryForm.distinct}
                                        onChange={(e) => updateField('distinct', e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                    />
                                    <span className="text-sm font-medium text-primary">Distinct Results</span>
                                </label>
                            </div>
                            <FormField label="IDE URL (Optional)">
                                <input
                                    type="text"
                                    value={queryForm.ideUrl || ''}
                                    onChange={(e) => updateField('ideUrl', e.target.value)}
                                    className="app-input"
                                    placeholder="https://..."
                                />
                            </FormField>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="font-bold text-primary-muted uppercase tracking-tight text-xs">
                {label}
            </label>
            {children}
        </div>
    );
}
