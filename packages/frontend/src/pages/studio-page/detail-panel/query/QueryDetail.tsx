import { type SchemaDto } from '@cms/shared';
import { Info, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import { config } from '../../../../config';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from './PublishConfirmDialog';

interface QueryDetailProps {
    schema: SchemaDto;
}

function EndpointPreview({ url }: { url: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(url);
                const json = await res.json();
                setData(json);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]);

    if (loading) return <div className="mt-2 text-xs text-muted-foreground">Loading response...</div>;
    if (error) return <div className="mt-2 text-xs text-red-500">Error: {error}</div>;
    if (!data) return null;

    return (
        <div className="mt-2">
            <div className="text-xs font-medium mb-1.5 text-muted-foreground">Response Preview</div>
            <pre className="bg-slate-950 text-slate-50 p-3 rounded-lg text-xs font-mono overflow-auto max-h-60 border border-slate-800">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

export function QueryDetail({ schema }: QueryDetailProps) {
    const query = schema.settings.query!;
    const listUrl = `${config.CMS_BASE_URL}/api/queries/${query.name}`;
    const singleUrl = `${config.CMS_BASE_URL}/api/queries/${query.name}/single`;

    const { publishSchema } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

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
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
            {/* Publish Section */}
            {schema.publicationStatus !== 'published' && (
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-orange-600">Query Not Published</h4>
                        <p className="text-xs text-orange-600/80">
                            This query has unsaved changes or hasn't been published yet.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsPublishDialogOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Publish Now
                    </button>
                </div>
            )}

            {/* Explanation Section */}
            <div className="bg-blue-50/5 p-4 rounded-lg border border-blue-500/20 shadow-sm">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">GraphQL to GET API Conversion</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The system automatically converts your GraphQL request into a GET API endpoint. You can use this to fetch results directly in your applications.
                        </p>
                    </div>
                </div>
            </div>

            {/* API Endpoints Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-base font-semibold mb-4">API Endpoints</h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">1. List Endpoint</label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use this endpoint to retrieve a list of results based on your query.
                            </p>
                            <div className="relative group">
                                <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-xs text-foreground break-all hover:bg-muted transition-colors select-all">
                                    {listUrl}
                                </div>
                            </div>
                            <EndpointPreview url={listUrl} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">2. Single Endpoint</label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use this endpoint to retrieve a single result. ideal for fetching details by ID.
                            </p>
                            <div className="relative group">
                                <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-xs text-foreground break-all hover:bg-muted transition-colors select-all">
                                    {singleUrl}
                                </div>
                            </div>
                            <EndpointPreview url={singleUrl} />
                        </div>
                    </div>
                </div>
            </div>

            <PublishConfirmDialog
                isOpen={isPublishDialogOpen}
                onClose={() => setIsPublishDialogOpen(false)}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
            />
        </div>
    )
}
