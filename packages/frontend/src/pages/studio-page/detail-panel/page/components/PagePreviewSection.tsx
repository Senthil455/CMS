import { useMemo } from 'react';
import { Globe } from 'lucide-react';
import useSWR from 'swr';
import axios from 'axios';
import Handlebars from 'handlebars';
import { type SchemaDto, ENDPOINTS } from '@cms/shared';
import { config } from '../../../../../config';

interface PagePreviewSectionProps {
    schema: SchemaDto;
    html?: string;
    hideHeader?: boolean;
}

export function PagePreviewSection({ schema, html, hideHeader }: PagePreviewSectionProps) {
    const page = schema.settings.page!;

    const { data: pageData } = useSWR(
        schema.schemaId ? `${config.CMS_BASE_URL}${ENDPOINTS.QUERY.PAGE_DATA}?id=${schema.schemaId}` : null,
        url => axios.get(url, { withCredentials: true }).then(res => res.data)
    );

    const targetHtml = html ?? page.html;

    const renderedHtml = useMemo(() => {
        if (!pageData || !targetHtml) return targetHtml;
        try {
            const template = Handlebars.compile(targetHtml);
            const result = template(pageData);
            return result;
        } catch (e) {
            console.error('Failed to render Handlebars template', e);
            return targetHtml;
        }
    }, [targetHtml, pageData]);

    return (
        <section className={`space-y-4 ${hideHeader ? 'h-full flex flex-col' : ''}`}>
            {!hideHeader && (
                <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Preview
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                        {pageData ? (
                            <span className="text-green-500">
                                Data: Loaded
                            </span>
                        ) : (
                            <span className="text-orange-500 animate-pulse">Data: Loading...</span>
                        )}
                        <span className="w-px h-2 bg-border"></span>
                        <span className={renderedHtml !== targetHtml ? "text-green-500" : "text-orange-500"}>
                            Render: {renderedHtml !== targetHtml ? "Success" : "Original HTML"}
                        </span>
                    </div>
                </div>
            )}
            <div className={`border border-border rounded-xl overflow-hidden bg-white shadow-sm w-full ${hideHeader ? 'flex-1' : 'h-[600px]'}`}>
                <iframe
                    title="Page Preview"
                    srcDoc={renderedHtml}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </section>
    );
}
