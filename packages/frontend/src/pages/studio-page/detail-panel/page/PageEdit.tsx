import { useState } from 'react';
import toast from 'react-hot-toast';
import { type SchemaDto, type SaveSchemaPayload, type ParsedPageDto } from '@cms/shared';
import { useSchemas } from '../../../../hooks/use-schemas';
import { useSocket } from '../../../../hooks/use-socket';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { PageEditHeader } from './components/PageEditHeader';
import { PageEditSettings } from './components/PageEditSettings';
import { PageEditSource } from './components/PageEditSource';

interface PageEditProps {
    item: SchemaDto;
    initialTab?: 'settings' | 'code';
    onTabChange?: (tab: 'settings' | 'code') => void;
    onSave: (payload: SaveSchemaPayload, skipNavigate?: boolean) => Promise<void>;
    onCancel: () => void;
}

export function PageEdit({ item, initialTab = 'settings', onTabChange, onSave, onCancel }: PageEditProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'code'>(initialTab);

    // Sync internal state if prop changes (e.g. via URL)
    if (initialTab !== activeTab) {
        setActiveTab(initialTab);
    }

    const handleTabChange = (tab: 'settings' | 'code') => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { publishSchema } = useSchemas();
    const { } = useSocket();
    const [pageForm, setPageForm] = useState<ParsedPageDto>(() => {
        const initialForm = JSON.parse(JSON.stringify(item.settings.page));
        if (typeof initialForm.metadata === 'string') {
            try {
                initialForm.metadata = JSON.parse(initialForm.metadata);
            } catch (e) {
                // If parsing fails for some reason, we might have issue matching ParsedPageDto.metadata type
                // But for now let's assume it parses or handle empty object fallback
                initialForm.metadata = {};
            }
        }
        return initialForm as ParsedPageDto;
    });

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const payload: SaveSchemaPayload = {
                schemaId: item.schemaId,
                type: 'page',
                settings: {
                    page: {
                        ...pageForm,
                        metadata: JSON.stringify(pageForm.metadata)
                    }
                }
            };

            await onSave(payload, true);
            toast.success('Saved successfully');
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
            onCancel(); // Navigate back after publishing
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to publish page.');
            setShowPublishConfirm(false);
        } finally {
            setIsPublishing(false);
        }
    };



    const updateField = (field: keyof ParsedPageDto, value: any) => {

        setPageForm({ ...pageForm, [field]: value });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-app overflow-hidden">
            <PageEditHeader
                item={item}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onSave={handleSave}
                onCancel={onCancel}
                isSaving={isSaving}
            />

            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-8 w-full h-full flex flex-col">
                    {activeTab === 'settings' && (
                        <PageEditSettings
                            pageForm={pageForm}
                            onUpdateField={updateField}
                        />
                    )}

                    {activeTab === 'code' && (
                        <PageEditSource
                            item={item}
                            pageForm={pageForm}
                            onUpdateField={updateField}
                            onSave={handleSave}
                            onCancel={onCancel}
                            isSaving={isSaving}
                        />
                    )}
                </div>
            </div>
            <PublishConfirmDialog
                isOpen={showPublishConfirm}
                onClose={onCancel}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
                type="page"
            />
        </div>
    );
}
