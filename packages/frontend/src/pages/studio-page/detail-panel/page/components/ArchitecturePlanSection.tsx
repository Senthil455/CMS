import { Layout, FileText, Cpu } from 'lucide-react';
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


        </section>
    );
}
