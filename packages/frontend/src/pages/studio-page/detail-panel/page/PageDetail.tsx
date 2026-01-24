import { type SchemaDto, type PageMetadata } from '@cms/shared';
import { useState, useMemo } from 'react';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { PagePublishSection } from './components/PagePublishSection';
import { PageSettingsSection } from './components/PageSettingsSection';
import { ArchitecturePlanSection } from './components/ArchitecturePlanSection';
import { PageSelectedQueriesSection } from './components/PageSelectedQueriesSection';
import { PagePreviewSection } from './components/PagePreviewSection';

interface PageDetailProps {
    schema: SchemaDto;
}

export function PageDetail({ schema }: PageDetailProps) {
    debugger;
    const page = schema.settings.page!;

    const { publishSchema } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const metadata = useMemo<PageMetadata | null>(() => {
        if (!page.metadata) return null;
        try {
            return JSON.parse(page.metadata);
        } catch (e) {
            console.error('Failed to parse page metadata', e);
            return null;
        }
    }, [page.metadata]);

    const architecturePlan = metadata?.architecturePlan;

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

            <PageSettingsSection page={page} />

            {architecturePlan && (
                <ArchitecturePlanSection architecturePlan={architecturePlan} />
            )}

            {architecturePlan?.selectedQueries && (
                <PageSelectedQueriesSection selectedQueries={architecturePlan.selectedQueries} />
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
