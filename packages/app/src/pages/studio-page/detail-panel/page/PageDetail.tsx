import { type SchemaDto, type PageMetadata, type ParsedPageDto } from '@cms/shared';
import { useState, useMemo } from 'react';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { PagePublishSection } from './components/PagePublishSection';
import { PageComponentsSection } from './components/PageComponentsSection';
import { PagePreviewSection } from './components/PagePreviewSection';

interface PageDetailProps {
    schema: SchemaDto;
    onSendMessage: (msg: string) => void;
    onEditSource?: (id: string) => void;
}

export function PageDetail({ schema, onSendMessage, onEditSource }: PageDetailProps) {
    const page = schema.settings?.page!;

    const { publishSchema } = useSchemas();
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
            const updatedSchema = JSON.parse(JSON.stringify(schema));
            const metadata = updatedSchema.settings.page.metadata;

            // Remove from components map
            if (metadata.components) {
                delete metadata.components[componentId];
            }

            // Remove from instructions
            if (metadata.componentInstructions) {
                metadata.componentInstructions = metadata.componentInstructions.filter(
                    (instr: any) => instr.id !== componentId
                );
            }

            // Remove from layoutJson blocks
            if (metadata.layoutJson?.sections) {
                metadata.layoutJson.sections.forEach((section: any) => {
                    section.columns.forEach((col: any) => {
                        col.blocks = col.blocks.filter((block: any) => block.id !== componentId);
                    });
                });
            }

            // Save immediately via API (publishSchema saves to DB in CMS context)
            setIsPublishing(true);
            // First we need to update the schema in the React Context or API directly
            // In cms, modifying schema typically means saving via PageManager. Since we're frontend, 
            // we will send it back to the schemas hook using a generic update or standard save.
            // Using the raw API call to save schema here since publishSchema might just publish existing settings:
            await fetch(`/api/meta/schema/${updatedSchema.schemaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSchema)
            });

            setSelectedComponentId(null);
            alert('Component deleted successfully. The page will reload momentarily.');
            window.location.reload();
        } catch (e: any) {
            console.error(e);
            alert('Failed to delete component.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleModifyComponent = (componentId: string, req: string) => {
        onSendMessage(`@modify-component ${schema.schemaId} ${componentId} ${req}`);
    };

    return (
        <div className="flex flex-col h-full gap-4 pb-8">
            <PagePublishSection
                schema={schema}
                onPublish={() => setIsPublishDialogOpen(true)}
            />

            <PageComponentsSection
                metadata={parsedPage.metadata}
                selectedComponentId={selectedComponentId}
                onSelectComponent={setSelectedComponentId}
                onRemoveComponent={handleRemoveComponent}
                onModifyComponent={handleModifyComponent}
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
