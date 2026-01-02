import { useState, useMemo, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { type SchemaDto, type SaveSchemaPayload, type QueryDto } from '@cms/shared';
import { FileCode, Save, X, Loader2, Database, Code } from 'lucide-react';
import { GraphiQL } from 'graphiql';
import 'graphiql/graphiql.css';
import { config } from '../../../config';

interface QueryEditProps {
    item: SchemaDto;
    initialTab?: 'settings' | 'code';
    onTabChange?: (tab: 'settings' | 'code') => void;
    onSave: (payload: SaveSchemaPayload) => Promise<void>;
    onCancel: () => void;
}

export function QueryEdit({ item, initialTab = 'settings', onTabChange, onSave, onCancel }: QueryEditProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'code'>(initialTab);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleTabChange = (tab: 'settings' | 'code') => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    const [error, setError] = useState<string | null>(null);
    const [queryForm, setQueryForm] = useState<QueryDto>(() => {
        return JSON.parse(JSON.stringify(item.settings.query || {
            name: item.name,
            entityName: '',
            source: 'model',
            text: '',
            filters: [],
            sorts: [],
            reqVariables: [],
            distinct: false,
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
                    query: {
                        ...queryForm,
                        // Ensure text is explicitly included if it was missing before, though state handles it
                    }
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

    const fetcher = useMemo(() => async (graphQLParams: any) => {
        const response = await fetch(`${config.CMS_BASE_URL}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(graphQLParams),
        });
        return response.json();
    }, []);

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
                                    onClick={() => handleTabChange('code')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'code'
                                        ? 'bg-app-surface text-primary shadow-sm'
                                        : 'text-primary-muted hover:text-primary'
                                        }`}
                                >
                                    Source Code
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

                <div className="space-y-8 h-full flex flex-col">
                    {activeTab === 'settings' && (
                        <section className="space-y-4 shrink-0">
                            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Query Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Name">
                                    <input
                                        type="text"
                                        value={queryForm.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className="app-input"
                                    />
                                </FormField>
                            </div>
                        </section>
                    )}

                    {activeTab === 'code' && (
                        <section className="flex-1 flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                                    <Code className="w-4 h-4" />
                                    Query Source
                                </h3>
                            </div>

                            <div className="flex-1 h-full border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] relative">
                                {queryForm.source === 'sql' ? (
                                    <Editor
                                        height="100%"
                                        defaultLanguage="sql"
                                        // @ts-ignore
                                        value={queryForm.text || ''}
                                        // @ts-ignore
                                        onChange={(value) => updateField('text', value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            padding: { top: 16 },
                                            scrollBeyondLastLine: false,
                                            wordWrap: 'on',
                                            automaticLayout: true,
                                            tabSize: 2,
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full graphiql-container">
                                        {/* @ts-ignore */}
                                        <GraphiQL
                                            fetcher={fetcher}
                                            defaultQuery={queryForm.source}
                                            onEditQuery={(query: string) => updateField('source', query)}
                                        />
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
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
