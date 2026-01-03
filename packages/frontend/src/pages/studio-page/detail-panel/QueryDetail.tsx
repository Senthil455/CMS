import { useEffect } from 'react';
import { type QueryDto } from '@cms/shared';
import { Database } from 'lucide-react'; // Added Play, Loader2, AlertCircle

import GraphiQL from '../../../components/GraphiQL';

interface QueryDetailProps {
    query: QueryDto;
}

export function QueryDetail({ query }: QueryDetailProps) {
    useEffect(() => {
    }, [query.source]);

    return (
        <div className="space-y-8 max-w-5xl h-full flex flex-col">
            <section className="space-y-4 shrink-0">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Query Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem label="Entity Name" value={query.entityName} />
                </div>
            </section>
            <GraphiQL defaultQuery={query.source} />
        </div>
    )



}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">{label}</span>
            <div className="text-sm font-medium text-primary px-3 py-1.5 bg-app-surface border border-border rounded-lg shadow-sm">
                {value}
            </div>
        </div>
    );
}
