import { useState, useMemo, useEffect } from 'react';
import { type QueryDto } from '@cms/shared';
import { Database, Code, Play, Loader2, AlertCircle } from 'lucide-react'; // Added Play, Loader2, AlertCircle
import Editor from '@monaco-editor/react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { config } from '../../../config';
import "graphiql/graphiql.css";
import { GraphiQL } from 'graphiql';

interface QueryDetailProps {
    query: QueryDto;
}
const fetcher = async (graphQLParams: any) => {
    const response = await fetch(`${config.CMS_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(graphQLParams),
    });
    return response.json();
};
export function QueryDetail({ query }: QueryDetailProps) {
    const [queryText, setQueryText] = useState(query.source);
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset query text when the selected query changes
    useEffect(() => {
        setQueryText(query.source);
        setResult(null);
        setError(null);
    }, [query.source]);

    const handleRunQuery = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`${config.CMS_BASE_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: queryText }),
            });

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to execute query');
        } finally {
            setIsLoading(false);
        }
    };

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
            <GraphiQL fetcher={fetcher} />
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
