import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Database, ExternalLink } from 'lucide-react';
import useSWR from 'swr';
import axios from 'axios';
import Handlebars from 'handlebars';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { type SchemaDto, ENDPOINTS } from '@cms/shared';

// Register Handlebars helpers for common operations
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('lt', (a, b) => a < b);
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));
Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));

interface PagePreviewSectionProps {
    schema: SchemaDto;
    html?: string;
    hideHeader?: boolean;
    paramValues?: Record<string, string>;
    highlightComponentId?: string | null;
    onRenderError?: (error: string | null) => void;
}

const HIGHLIGHT_SCRIPT = `
<script>
window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'highlight-component') {
        // Remove previous highlights
        document.querySelectorAll('[data-component-id]').forEach(function(el) {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.transition = '';
        });
        var id = e.data.componentId;
        if (id) {
            var el = document.querySelector('[data-component-id="' + id + '"]');
            if (el) {
                el.style.outline = '3px solid #f97316';
                el.style.outlineOffset = '2px';
                el.style.transition = 'outline 0.2s ease';
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
});
</script>
`;

export function PagePreviewSection({ schema, html, hideHeader, paramValues, highlightComponentId, onRenderError }: PagePreviewSectionProps) {
    const page = schema.settings?.page!;
    const [showData, setShowData] = useState(false);

    const { data: pageData, error: loadError } = useSWR(
        schema.schemaId ? [
            `${''}${ENDPOINTS.QUERY.PAGE_DATA}`,
            schema.schemaId,
            paramValues
        ] : null,
        ([url, id, params]) => {
            const queryParams = new URLSearchParams({ id });
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value) queryParams.append(key, value);
                });
            }
            return axios.get(`${url}?${queryParams.toString()}`, { withCredentials: true }).then(res => res.data);
        }
    );

    const targetHtml = html ?? page.html;

    const { renderedHtml, renderError } = useMemo(() => {
        if (!pageData || !targetHtml) return { renderedHtml: targetHtml, renderError: null };
        try {
            const template = Handlebars.compile(targetHtml);
            const result = template(pageData);
            return { renderedHtml: result, renderError: null };
        } catch (e) {
            console.error('Failed to render Handlebars template', e);
            return { renderedHtml: targetHtml, renderError: e instanceof Error ? e.message : String(e) };
        }
    }, [targetHtml, pageData]);

    useEffect(() => {
        onRenderError?.(renderError);
    }, [renderError, onRenderError]);

    // Inject highlight script into rendered HTML
    const previewHtml = useMemo(() => {
        if (!renderedHtml) return renderedHtml;
        // Insert before </body> or at end
        if (renderedHtml.includes('</body>')) {
            return renderedHtml.replace('</body>', HIGHLIGHT_SCRIPT + '</body>');
        }
        return renderedHtml + HIGHLIGHT_SCRIPT;
    }, [renderedHtml]);

    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Send highlight message to iframe whenever highlightComponentId changes
    const sendHighlight = useCallback(() => {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'highlight-component', componentId: highlightComponentId || null }, '*');
        }
    }, [highlightComponentId]);

    useEffect(() => {
        sendHighlight();
    }, [sendHighlight]);

    return (
        <section className={`flex flex-col gap-4 overflow-hidden ${hideHeader ? 'h-full' : 'h-full'}`}>
            {!hideHeader && (
                <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Preview
                        </h3>
                        {pageData && (
                            <button
                                onClick={() => setShowData(!showData)}
                                className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${showData
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-app-muted text-primary-muted hover:bg-border'
                                    }`}
                            >
                                <Database className="w-3 h-3" />
                                {showData ? 'Show Preview' : 'Display Data'}
                            </button>
                        )}
                        {page?.name && (
                            <a
                                href={`${''}/${page.name}?version=${Date.now()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all bg-app-muted text-primary-muted hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Visit Page
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                        {loadError ? (
                            <span className="text-red-500" title={loadError.message}>
                                Data: {loadError.response?.data?.title || loadError.message || 'Load Error'}
                            </span>
                        ) : pageData ? (
                            <span className="text-green-500">
                                Data: Loaded
                            </span>
                        ) : (
                            <span className="text-orange-500 animate-pulse">Data: Loading...</span>
                        )}
                        <span className="w-px h-2 bg-border"></span>
                        <span className={renderError ? "text-red-500" : (renderedHtml !== targetHtml ? "text-green-500" : "text-orange-500")}>
                            Render: {renderError || (renderedHtml !== targetHtml ? "Success" : "Original HTML")}
                        </span>
                    </div>
                </div>
            )}
            <div className={`border border-border rounded-xl overflow-hidden bg-white shadow-sm w-full flex-1 min-h-0`}>
                {showData && pageData ? (
                    <div className="h-full overflow-auto p-4 bg-[#f8f9fa]">
                        <JsonView
                            src={pageData}
                            theme="default"
                            displaySize={true}
                            enableClipboard={true}
                            collapsed={false}
                        />
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        title="Page Preview"
                        srcDoc={previewHtml}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin"
                        onLoad={sendHighlight}
                    />
                )}
            </div>
        </section>
    );
}
