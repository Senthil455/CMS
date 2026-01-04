import { type QueryDto } from '@cms/shared';
import { Info } from 'lucide-react';
import { config } from '../../../../config';

interface QueryDetailProps {
    query: QueryDto;
}

export function QueryDetail({ query }: QueryDetailProps) {
    const listUrl = `${config.CMS_BASE_URL}/api/queries/${query.name}`;
    const singleUrl = `${config.CMS_BASE_URL}/api/queries/${query.name}/single`;

    return (
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

