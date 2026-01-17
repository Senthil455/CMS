import { Layout, FileText, Cpu, Database } from 'lucide-react';
import { DetailItem } from './DetailItem';

interface ArchitecturePlanSectionProps {
    architecturePlan: {
        pageType: string;
        architectureHints: string;
        selectedQueries: Array<{
            queryName: string;
            fieldName: string;
            type: string;
            description: string;
        }>;
    };
}

export function ArchitecturePlanSection({ architecturePlan }: ArchitecturePlanSectionProps) {
    return (
        <section className="space-y-4">
            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Architecture Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Page Type" value={architecturePlan.pageType} icon={<Layout className="w-3.5 h-3.5" />} />
                <div className="md:col-span-2">
                    <DetailItem
                        label="Architecture Hints"
                        value={architecturePlan.architectureHints}
                        icon={<FileText className="w-3.5 h-3.5" />}
                    />
                </div>
            </div>

            {architecturePlan.selectedQueries?.length > 0 && (
                <div className="space-y-3">
                    <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-1.5 px-3">
                        <Database className="w-3.5 h-3.5" />
                        Selected Queries
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                        {architecturePlan.selectedQueries.map((sq, idx) => (
                            <div key={idx} className="px-3 py-2 bg-app-surface border border-border rounded-lg shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-primary">{sq.queryName}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-md border border-blue-500/20 font-bold font-mono">
                                            {sq.fieldName}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-bold ${sq.type === 'list'
                                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                            : 'bg-green-500/10 text-green-600 border-green-500/20'
                                            }`}>
                                            {sq.type}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-primary-muted">{sq.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
