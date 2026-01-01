import { useState } from 'react';
import { type SchemaDto, type SaveSchemaPayload, type PageDto } from '@cms/shared';
import { Layout, Save, X, Loader2, Info, FileText, Globe, Code } from 'lucide-react';

interface PageEditProps {
    item: SchemaDto;
    initialTab?: 'settings' | 'code';
    onSave: (payload: SaveSchemaPayload) => Promise<void>;
    onCancel: () => void;
}

export function PageEdit({ item, initialTab = 'settings', onSave, onCancel }: PageEditProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'code'>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageForm, setPageForm] = useState<PageDto>(() => {
        return JSON.parse(JSON.stringify(item.settings.page || {
            name: item.name,
            title: item.name,
            query: '',
            html: '',
            css: '',
            components: '',
            styles: ''
        }));
    });

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const payload: SaveSchemaPayload = {
                schemaId: item.schemaId,
                type: 'page',
                settings: {
                    page: pageForm
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

    const updateField = (field: keyof PageDto, value: any) => {
        setPageForm({ ...pageForm, [field]: value });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-app overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-app-surface shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Layout className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Editing {item.name}</h2>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 bg-app-muted rounded-full text-primary-muted font-medium uppercase tracking-wider">
                                    {item.type}
                                </span>
                                <span className="text-xs text-primary-muted font-mono">{item.schemaId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-app-muted rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'code' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                    >
                        Source Code
                    </button>
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

                <div className="space-y-8 max-w-5xl h-full flex flex-col">
                    {activeTab === 'settings' && (
                        /* General Settings */
                        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                General Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Page Name">
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-2.5 w-4 h-4 text-primary-muted" />
                                        <input
                                            type="text"
                                            value={pageForm.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            className="app-input pl-9"
                                            placeholder="e.g. landing-page"
                                        />
                                    </div>
                                </FormField>
                                <FormField label="Page Title">
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-primary-muted" />
                                        <input
                                            type="text"
                                            value={pageForm.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                            className="app-input pl-9"
                                            placeholder="e.g. Landing Page"
                                        />
                                    </div>
                                </FormField>
                            </div>
                        </section>
                    )}

                    {activeTab === 'code' && (
                        /* Content */
                        <section className="space-y-4 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                HTML Content
                            </h3>
                            <div className="flex-1">
                                <textarea
                                    value={pageForm.html}
                                    onChange={(e) => updateField('html', e.target.value)}
                                    className="w-full h-full min-h-[500px] bg-app-surface border border-border rounded-xl p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                                    placeholder="<!DOCTYPE html>..."
                                />
                            </div>
                        </section>
                    )}
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
