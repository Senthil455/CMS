import { Layout, Globe, ExternalLink, Database } from 'lucide-react';
import { type ParsedPageDto } from '@cms/shared';
import { DetailItem } from './DetailItem';

interface PageSettingsSectionProps {
    page: ParsedPageDto;
}

export function PageSettingsSection({ page }: PageSettingsSectionProps) {
    return (
        <section className="space-y-3">
            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Page Settings
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <DetailItem label="Title" value={page.title} icon={<Globe className="w-3 h-3" />} />

                {page.metadata?.plan?.entityName && (
                    <DetailItem
                        label="Entity"
                        value={page.metadata.plan.entityName}
                        icon={<Database className="w-3 h-3" />}
                    />
                )}
            </div>

            <DetailItem
                label="URL"
                value={`${''}/${page.name}`}
                href={`${''}/${page.name}?version=${Date.now()}`}
                icon={<ExternalLink className="w-3 h-3" />}
                isLink
            />
        </section>
    );
}
