import { type SchemaDto, type PageMetadata, type ParsedPageDto, type SaveSchemaPayload, LayoutCompiler } from '@cms/shared';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { PagePublishSection } from './components/PagePublishSection';
import { PageComponentsSection } from './components/PageComponentsSection';
import { PagePreviewSection } from './components/PagePreviewSection';

interface PageDetailProps {
    schema: SchemaDto;
    onChatAction?: (action: string) => void;
    onEditSource?: (id: string) => void;
}

export function PageDetail({ schema, onChatAction, onEditSource }: PageDetailProps) {
    const page = schema.settings?.page!;

    const { publishSchema, saveSchema, mutate } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

    const parsedPage = useMemo<ParsedPageDto>(() => {
        let metadata: PageMetadata = {};
        if (page.metadata) {
            metadata = page.metadata;
        }
        return {
            ...page,
            metadata
        };
    }, [page]);

    const handleConfirmPublish = async () => {
        try {
            setIsPublishing(true);
            await publishSchema(schema.id, schema.schemaId!);
            setIsPublishDialogOpen(false);
        } catch (err: any) {
            console.error(err);
            alert('Failed to publish: ' + (err.message || 'Unknown error'));
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRemoveComponent = async (componentId: string) => {
        if (!confirm(`Are you sure you want to delete component "${componentId}"?`)) return;

        try {
            setIsPublishing(true);
            const updatedSchema = JSON.parse(JSON.stringify(schema));
            const metadata = updatedSchema.settings.page.metadata;

            // Remove from components map
            if (metadata.components) {
                metadata.components = metadata.components.filter(
                    (c: any) => c.id !== componentId
                );
            }

            // Remove from instructions
            if (metadata.componentInstructions) {
                metadata.componentInstructions = metadata.componentInstructions.filter(
                    (instr: any) => instr.id !== componentId
                );
            }

            // Remove from architecture sections (layout ids)
            if (metadata.architecture?.sections) {
                metadata.architecture.sections.forEach((section: any) => {
                    section.columns.forEach((col: any) => {
                        if (col.ids) {
                            col.ids = col.ids.filter((id: string) => id !== componentId);
                        }
                    });
                });
            }

            // Recompile HTML to reflect the removal
            let htmlToSave = updatedSchema.settings.page.html;
            if (metadata.architecture?.sections) {
                htmlToSave = LayoutCompiler.compile(
                    metadata.architecture.sections,
                    metadata.components || [],
                    updatedSchema.settings.page.title,
                    { enableVisitTrack: metadata.enableVisitTrack }
                );
            }

            const payload: SaveSchemaPayload = {
                schemaId: updatedSchema.schemaId,
                type: 'page',
                settings: {
                    page: {
                        ...updatedSchema.settings.page,
                        html: htmlToSave,
                        metadata: metadata
                    }
                }
            };

            await saveSchema(payload);
            await mutate();

            setSelectedComponentId(null);
            toast.success('Component deleted successfully');
        } catch (e: any) {
            console.error(e);
            toast.error('Failed to delete component: ' + (e.message || 'Unknown error'));
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 pb-8">
            <PagePublishSection
                schema={schema}
                onPublish={() => setIsPublishDialogOpen(true)}
            />

            <PageComponentsSection
                metadata={parsedPage.metadata}
                schemaId={schema.schemaId!}
                selectedComponentId={selectedComponentId}
                onSelectComponent={setSelectedComponentId}
                onRemoveComponent={handleRemoveComponent}
                onChatAction={onChatAction}
                onEditSource={onEditSource}
            />

            <div className="flex-1 min-h-0">
                <PagePreviewSection
                    schema={schema}
                    highlightComponentId={selectedComponentId}
                />
            </div>

            <PublishConfirmDialog
                isOpen={isPublishDialogOpen}
                onClose={() => setIsPublishDialogOpen(false)}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
                type="page"
            />
        </div>
    );
}
