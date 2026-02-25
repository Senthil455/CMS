import { useState } from 'react';
import toast from 'react-hot-toast';
import { type SchemaDto, type SaveSchemaPayload, type ParsedPageDto, LayoutCompiler, type LayoutJson } from '@cms/shared';
import { useSchemas } from '../../../../hooks/use-schemas';
import { useSocket } from '../../../../hooks/use-socket';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { PageEditHeader } from './components/PageEditHeader';
import { PageEditSettings } from './components/PageEditSettings';
import { PageEditLayout } from './components/PageEditLayout';
import { PageEditSource } from './components/PageEditSource';

interface PageEditProps {
    item: SchemaDto;
    initialTab?: 'settings' | 'layout' | 'view-html';
    onTabChange?: (tab: 'settings' | 'layout' | 'view-html') => void;
    onSave: (payload: SaveSchemaPayload, skipNavigate?: boolean) => Promise<void>;
    onCancel: () => void;
    onSendMessage?: (msg: string) => void;
}

export function PageEdit({ item, initialTab = 'settings', onTabChange, onSave, onCancel, onSendMessage }: PageEditProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'layout' | 'view-html'>(initialTab);

    // Sync internal state if prop changes (e.g. via URL)
    if (initialTab !== activeTab) {
        setActiveTab(initialTab);
    }

    const handleTabChange = (tab: 'settings' | 'layout' | 'view-html') => {
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
        if (!initialForm.metadata || typeof initialForm.metadata === 'string') {
            try {
                initialForm.metadata = initialForm.metadata ? JSON.parse(initialForm.metadata) : {};
            } catch (e) {
                initialForm.metadata = {};
            }
        }
        return initialForm as ParsedPageDto;
    });

    const handleSave = async (exitAfterSave: boolean) => {
        try {
            setIsSaving(true);
            setError(null);

            let htmlToSave = pageForm.html;

            // Compile the LayoutJson into Tailwind Grid HTML if using the Layout Editor
            if (pageForm.metadata?.layoutJson) {
                const layoutJson = pageForm.metadata.layoutJson as LayoutJson;

                // Use AI-generated components from metadata, falling back to HTML_BLOCKS
                const componentsMap: Record<string, { html: string; props?: any }> = {};
                const metadataComponents = pageForm.metadata.components || {};

                layoutJson.sections.forEach(section => {
                    section.columns.forEach(col => {
                        col.blocks.forEach(block => {
                            if (metadataComponents[block.id]) {
                                componentsMap[block.id] = metadataComponents[block.id];
                            } else {
                                componentsMap[block.id] = { html: `<!-- Generating component ${block.type} -->`, props: {} };
                            }
                        });
                    });
                });

                htmlToSave = LayoutCompiler.compile(layoutJson, componentsMap, pageForm.title, { enableVisitTrack: pageForm.metadata?.enableVisitTrack });
            }

            const payload: SaveSchemaPayload = {
                schemaId: item.schemaId,
                type: 'page',
                settings: {
                    page: {
                        ...pageForm,
                        html: htmlToSave,
                        metadata: pageForm.metadata
                    }
                }
            };

            await onSave(payload, true);
            toast.success('Saved successfully');
            if (exitAfterSave) {
                onCancel();
            }
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
        let updatedForm = { ...pageForm, [field]: value };

        // Auto-recompile HTML when title or metadata (e.g. tracking toggle) changes
        if ((field === 'title' || field === 'metadata') && updatedForm.metadata && updatedForm.metadata.layoutJson) {
            const layoutJson = updatedForm.metadata.layoutJson as LayoutJson;
            const componentsMap: Record<string, { html: string; props?: any }> = {};
            const metadataComponents = updatedForm.metadata.components || {};

            layoutJson.sections.forEach(section => {
                section.columns.forEach(col => {
                    col.blocks.forEach(block => {
                        if (metadataComponents[block.id]) {
                            componentsMap[block.id] = metadataComponents[block.id];
                        } else {
                            componentsMap[block.id] = { html: `<!-- Generating component ${block.type} -->`, props: {} };
                        }
                    });
                });
            });

            updatedForm.html = LayoutCompiler.compile(layoutJson, componentsMap, updatedForm.title, { enableVisitTrack: updatedForm.metadata?.enableVisitTrack });
        }

        setPageForm(updatedForm);
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

                    {activeTab === 'layout' && (
                        <PageEditLayout
                            item={item}
                            pageForm={pageForm}
                            onUpdateField={updateField}
                            onSave={handleSave}
                            onCancel={onCancel}
                            onSendMessage={onSendMessage}
                            isSaving={isSaving}
                        />
                    )}

                    {activeTab === 'view-html' && (
                        <PageEditSource
                            item={item}
                            pageForm={pageForm}
                            onUpdateField={updateField}
                            onSave={handleSave}
                            onCancel={onCancel}
                            isSaving={isSaving}
                            readOnly={true}
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
