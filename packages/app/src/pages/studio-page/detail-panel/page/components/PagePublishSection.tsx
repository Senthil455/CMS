import { UploadCloud } from 'lucide-react';
import { type SchemaDto } from '@cms/shared';

interface PagePublishSectionProps {
    schema: SchemaDto;
    onPublish: () => void;
}

export function PagePublishSection({ schema, onPublish }: PagePublishSectionProps) {
    if (schema.publicationStatus === 'published') return null;

    return (
        <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 shadow-sm flex items-center justify-between shrink-0">
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-orange-600">Page Not Published</h4>
                <p className="text-xs text-orange-600/80">
                    This page has unsaved changes or hasn't been published yet.
                </p>
            </div>
            <button
                onClick={onPublish}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm"
            >
                <UploadCloud className="w-3.5 h-3.5" />
                Publish Now
            </button>
        </div>
    );
}
