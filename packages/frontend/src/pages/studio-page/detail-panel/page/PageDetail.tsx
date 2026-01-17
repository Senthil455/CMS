import { type SchemaDto } from '@cms/shared';
import { Layout, FileText, Globe, ExternalLink, UploadCloud, Cpu, Database } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSchemas } from '../../../../hooks/use-schemas';
import { PublishConfirmDialog } from '../shared/PublishConfirmDialog';
import { config } from '../../../../config';

interface PageDetailProps {
    schema: SchemaDto;
}

export function PageDetail({ schema }: PageDetailProps) {
    const page = schema.settings.page!;

    const { publishSchema } = useSchemas();
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const metadata = useMemo(() => {
        if (!page.metadata) return null;
        try {
            return JSON.parse(page.metadata);
        } catch (e) {
            console.error('Failed to parse page metadata', e);
            return null;
        }
    }, [page.metadata]);

    const architecturePlan = metadata?.architecturePlan;

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

    return (
        <div className="space-y-8">
            {/* Publish Section */}
            {schema.publicationStatus !== 'published' && (
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-orange-600">Page Not Published</h4>
                        <p className="text-xs text-orange-600/80">
                            This page has unsaved changes or hasn't been published yet.
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
                            href={`${config.CMS_BASE_URL}/${page.name}?version=${Date.now()}`}
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                            isLink
                        />
                    </div>
                </div>
            </section>

            {architecturePlan && (
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
                                {architecturePlan.selectedQueries.map((sq: any, idx: number) => (
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
            )}

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

            <PublishConfirmDialog
                isOpen={isPublishDialogOpen}
                onClose={() => setIsPublishDialogOpen(false)}
                onConfirm={handleConfirmPublish}
                isPublishing={isPublishing}
                type="page"
            />
        </div>
    );
}

function DetailItem({ label, value, href, icon, isLink }: { label: string; value: string; href?: string; icon?: React.ReactNode; isLink?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <div className="text-sm font-medium text-primary px-3 py-2 bg-app-surface border border-border rounded-lg shadow-sm group relative">
                {isLink && value ? (
                    <a
                        href={href || value}
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
