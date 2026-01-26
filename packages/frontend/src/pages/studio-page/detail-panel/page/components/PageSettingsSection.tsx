import { Layout, FileText, Globe, ExternalLink, Tag, Box, MessageSquare, Database } from 'lucide-react';
import { type ParsedPageDto } from '@cms/shared';
import { config } from '../../../../../config';
import { DetailItem } from './DetailItem';

interface PageSettingsSectionProps {
    page: ParsedPageDto;
}

export function PageSettingsSection({ page }: PageSettingsSectionProps) {
    return (
        <section className="space-y-4">
            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Page Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Page Name" value={page.name} icon={<FileText className="w-3.5 h-3.5" />} />
                <DetailItem label="Page Title" value={page.title} icon={<Globe className="w-3.5 h-3.5" />} />

                {page.metadata?.plan?.pageType && (
                    <DetailItem
                        label="Type"
                        value={page.metadata.plan.pageType}
                        icon={<Tag className="w-3.5 h-3.5" />}
                    />
                )}

                {page.metadata?.templateId && (
                    <DetailItem
                        label="Template"
                        value={page.metadata.templateId}
                        icon={<Box className="w-3.5 h-3.5" />}
                    />
                )}

                {(page.metadata?.plan?.pageType === 'detail' || (page.metadata as any)?.enableEngagementBar !== undefined) && (
                    <DetailItem
                        label="Engagement Bar"
                        value={page.metadata?.enableEngagementBar ? 'Enabled' : 'Disabled'}
                        icon={<MessageSquare className="w-3.5 h-3.5" />}
                    />
                )}

                {page.metadata?.plan?.entityName && (
                    <DetailItem
                        label="Entity"
                        value={page.metadata.plan.entityName}
                        icon={<Database className="w-3.5 h-3.5" />}
                    />
                )}

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
    );
}
