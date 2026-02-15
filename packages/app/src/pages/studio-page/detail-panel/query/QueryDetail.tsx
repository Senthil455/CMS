import { type SchemaDto } from '@cms/shared';
import { Info, UploadCloud, Play } from 'lucide-react';
import { useState } from 'react';
import { config } from '../../../../config';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { EndpointPreview } from './EndpointPreview';

interface QueryDetailProps {
    schema: SchemaDto;
}


export function QueryDetail({ schema }: QueryDetailProps) {
    const query = schema.settings.query!;
    const listUrl = `${config.CMS_BASE_URL}/api/queries/${query.name}`;
    const singleUrl = `${config.CMS_BASE_URL}/api/queries/${query.name}/single`;

    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [paginationValues, setPaginationValues] = useState({
        limit: query.pagination?.limit || '10',
        offset: query.pagination?.offset || '0'
    });
    const [testTrigger, setTestTrigger] = useState(0);

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

    const handleTest = () => {
        setTestTrigger(prev => prev + 1);
    };

    const combinedParams = {
        ...variableValues,
        limit: paginationValues.limit,
        offset: paginationValues.offset
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

            {/* Variables Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold">Variables</h3>
                {query.variables && query.variables.length > 0 ? (
                    <div className="space-y-3">
                        {query.variables.filter((v: any) => v.name !== 'sandbox').map((v: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1.5 p-3 bg-muted/20 border border-border rounded-lg transition-all hover:bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-primary-muted uppercase tracking-wider font-mono">
                                        {v.name}
                                    </label>
                                    {v.isRequired ? (
                                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-bold rounded uppercase">
                                            Required
                                        </span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[9px] font-bold rounded uppercase">
                                            Optional
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder={`Value for ${v.name}`}
                                    className="app-input h-8 text-xs font-mono"
                                    value={variableValues[v.name] || ''}
                                    onChange={(e) => setVariableValues({
                                        ...variableValues,
                                        [v.name]: e.target.value
                                    })}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic lg:p-4 lg:bg-muted/10 lg:rounded-lg lg:border lg:border-dashed lg:border-border">
                        No variables for this query.
                    </p>
                )}
            </div>

            {/* Pagination Section */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold">Pagination</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 p-3 bg-muted/20 border border-border rounded-lg">
                        <label className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">
                            Limit
                        </label>
                        <input
                            type="text"
                            className="app-input h-8 text-xs font-mono"
                            value={paginationValues.limit}
                            onChange={(e) => setPaginationValues({ ...paginationValues, limit: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 p-3 bg-muted/20 border border-border rounded-lg">
                        <label className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">
                            Offset
                        </label>
                        <input
                            type="text"
                            className="app-input h-8 text-xs font-mono"
                            value={paginationValues.offset}
                            onChange={(e) => setPaginationValues({ ...paginationValues, offset: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* API Endpoints Section */}
            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold">API Endpoints</h3>
                        <button
                            onClick={handleTest}
                            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-app rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-md active:scale-95"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Test Request
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">1. List Endpoint</label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use this endpoint to retrieve a list of results based on your query.
                            </p>
                            <EndpointPreview
                                baseUrl={listUrl}
                                params={combinedParams}
                                trigger={testTrigger}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">2. Single Endpoint</label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use this endpoint to retrieve a single result. ideal for fetching details by ID.
                            </p>
                            <EndpointPreview
                                baseUrl={singleUrl}
                                params={combinedParams}
                                trigger={testTrigger}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <PublishConfirmDialog
                isOpen={isPublishDialogOpen}
                onClose={() => setIsPublishDialogOpen(false)}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
                type="query"
            />
        </div>
    )
}
