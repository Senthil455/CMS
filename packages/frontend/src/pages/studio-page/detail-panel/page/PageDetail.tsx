import { type PageDto } from '@cms/shared';
import { Layout, FileText, Globe, ExternalLink } from 'lucide-react';
import { config } from '../../../../config';

interface PageDetailProps {
    page: PageDto;
}

export function PageDetail({ page }: PageDetailProps) {
    return (
        <div className="space-y-6">
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Page Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem label="Page Name" value={page.name} icon={<FileText className="w-3.5 h-3.5" />} />
                    <DetailItem label="Page Title" value={page.title} icon={<Globe className="w-3.5 h-3.5" />} />
                    <div className="md:col-span-2">
                        <DetailItem
                            label="Page URL"
                            value={`${config.CMS_BASE_URL}/${page.name}`}
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                            isLink
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Preview
                </h3>
                <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm h-[600px] w-full">
                    <iframe
                        title="Page Preview"
                        srcDoc={page.html}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            </section>
        </div>
    );
}

function DetailItem({ label, value, icon, isLink }: { label: string; value: string; icon?: React.ReactNode; isLink?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <div className="text-sm font-medium text-primary px-3 py-2 bg-app-surface border border-border rounded-lg shadow-sm group relative">
                {isLink && value ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 hover:underline break-all"
                    >
                        {value}
                    </a>
                ) : (
                    value || <span className="text-primary-muted italic">Not set</span>
                )}
            </div>
        </div>
    );
}
