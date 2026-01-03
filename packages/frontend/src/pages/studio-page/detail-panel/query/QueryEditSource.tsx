import { type QueryDto } from '@cms/shared';
import { Code } from 'lucide-react';
import GraphiQL from '../../../../components/GraphiQL';

interface QueryEditSourceProps {
    queryForm: QueryDto;
    updateField: (field: keyof QueryDto, value: any) => void;
}

export function QueryEditSource({ queryForm, updateField }: QueryEditSourceProps) {
    return (
        <section className="flex-1 flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Query Source
                </h3>
            </div>

            <div className="flex-1 h-full border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] relative">
                <GraphiQL
                    key={queryForm.name}
                    defaultQuery={queryForm.source}
                    onEditQuery={(query: string) => updateField('source', query)}
                    className="h-full w-full graphiql-container"
                    style={{ height: '100%', width: '100%' }}
                />
            </div>
        </section>
    );
}
