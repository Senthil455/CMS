import { type QueryDto } from '@cms/shared';
import { Database, Filter, ArrowUpDown, Variable, Link } from 'lucide-react';

interface QueryDetailProps {
    query: QueryDto;
}

export function QueryDetail({ query }: QueryDetailProps) {
    return (
        <div className="space-y-8 max-w-5xl">
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Query Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem label="Entity Name" value={query.entityName} />
                    <DetailItem label="Source" value={query.source} />
                    <DetailItem label="Distinct" value={query.distinct ? 'Yes' : 'No'} />
                    {query.ideUrl && (
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">IDE URL</span>
                            <div className="text-sm font-medium text-primary px-3 py-1.5 bg-app-surface border border-border rounded-lg shadow-sm flex items-center gap-2">
                                <Link className="w-3 h-3 text-primary-muted" />
                                <a href={query.ideUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-primary/80">
                                    {query.ideUrl}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Filters Section */}
            {query.filters && query.filters.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </h3>
                    <div className="bg-app-surface border border-border rounded-xl p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap text-primary/80">
                            {JSON.stringify(query.filters, null, 2)}
                        </pre>
                    </div>
                </section>
            )}

            {/* Sorts Section */}
            {query.sorts && query.sorts.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" />
                        Sorting
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {query.sorts.map((sort, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-app-surface border border-border rounded-lg">
                                <span className="text-xs font-mono font-bold text-primary">{sort.field}</span>
                                <span className="text-[10px] uppercase font-bold text-primary-muted bg-app-muted px-1.5 py-0.5 rounded">
                                    {sort.order}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Variables Section */}
            {query.reqVariables && query.reqVariables.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                        <Variable className="w-4 h-4" />
                        Variables
                    </h3>
                    <div className="bg-app-surface border border-border rounded-xl p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap text-primary/80">
                            {JSON.stringify(query.reqVariables, null, 2)}
                        </pre>
                    </div>
                </section>
            )}
        </div>
    );
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
