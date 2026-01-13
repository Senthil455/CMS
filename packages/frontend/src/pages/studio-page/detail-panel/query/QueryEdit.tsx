import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type SchemaDto, type SaveSchemaPayload, type QueryDto } from '@cms/shared';
import { FileCode, Save, X, Loader2 } from 'lucide-react';
import { QueryEditSetting } from './QueryEditSetting';
import { QueryEditSource } from './QueryEditSource';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';

interface QueryEditProps {
    item: SchemaDto;
    initialTab?: 'settings' | 'code';
    onTabChange?: (tab: 'settings' | 'code') => void;
    onSave: (payload: SaveSchemaPayload, skipNavigate?: boolean) => Promise<void>;
    onCancel: () => void;
}

export function QueryEdit({ item, initialTab = 'settings', onTabChange, onSave, onCancel }: QueryEditProps) {
    const navigate = useNavigate();
    const { publishSchema } = useSchemas();
    const [activeTab, setActiveTab] = useState<'settings' | 'code'>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

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
    const [queryForm, setQueryForm] = useState<QueryDto>(item.settings.query!);

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
                    }
                }
            };

            await onSave(payload, true);

            // Open publish dialog
            setIsPublishDialogOpen(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmPublish = async () => {
        try {
            setIsPublishing(true);
            await publishSchema(item.id, item.schemaId!);
            setIsPublishDialogOpen(false);
            navigate(`/app/${item.type}/${item.schemaId}`);
        } catch (err: any) {
            console.error(err);
            // Maybe show error in dialog or main toast? For now just log it.
            alert('Failed to publish: ' + (err.message || 'Unknown error'));
        } finally {
            setIsPublishing(false);
        }
    };

    const updateField = (field: keyof QueryDto, value: any) => {
        console.log(field, value);
        setQueryForm({ ...queryForm, [field]: value });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-app overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-app-surface shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
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
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-md"
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
                        <QueryEditSetting queryForm={queryForm} updateField={updateField} />
                    )}

                    {activeTab === 'code' && (
                        <QueryEditSource item={item} queryForm={queryForm} updateField={updateField} />
                    )}
                </div>
            </div>

            <PublishConfirmDialog
                isOpen={isPublishDialogOpen}
                onClose={() => {
                    setIsPublishDialogOpen(false);
                    navigate(`/app/${item.type}/${item.schemaId}`);
                }}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
                type="query"
            />
        </div>
    );
}
