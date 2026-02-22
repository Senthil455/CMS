import { type SchemaDto, type PageMetadata, type ParsedPageDto } from '@cms/shared';
import { useState, useMemo } from 'react';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { PagePublishSection } from './components/PagePublishSection';
import { PageSettingsSection } from './components/PageSettingsSection';

import { PageSelectedQueriesSection } from './components/PageSelectedQueriesSection';
import { PagePreviewSection } from './components/PagePreviewSection';

interface PageDetailProps {
    schema: SchemaDto;
}

export function PageDetail({ schema }: PageDetailProps) {
    const page = schema.settings?.page!;

    const { publishSchema } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

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

    const architecture = parsedPage.metadata.architecture;

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

    return (
        <div className="space-y-8">
            <PagePublishSection
                schema={schema}
                onPublish={() => setIsPublishDialogOpen(true)}
            />

            <PageSettingsSection page={parsedPage} />



            {architecture?.selectedQueries && (
                <PageSelectedQueriesSection selectedQueries={architecture.selectedQueries} />
            )}

            <PagePreviewSection schema={schema} />

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
