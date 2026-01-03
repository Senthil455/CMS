import { type QueryDto } from '@cms/shared';
import { Code } from 'lucide-react';

import GraphiQL from '../../../../components/GraphiQL';

interface QueryDetailProps {
    query: QueryDto;
}

export function QueryDetail({ query }: QueryDetailProps) {
    return (
        <div className="h-full flex flex-col">
            <section className="flex-1 flex flex-col min-h-0 space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Query Source
                </h3>
                <div className="flex-1 h-full border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] relative">
                    <GraphiQL
                        key={query.source}
                        defaultQuery={query.source}
                        className="h-full w-full graphiql-container"
                        style={{ height: '100%', width: '100%' }}
                    />
                </div>
            </section>
        </div>
    )
}

