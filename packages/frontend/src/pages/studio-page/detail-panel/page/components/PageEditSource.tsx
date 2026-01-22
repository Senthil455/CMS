import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, X, Save, Loader2, Maximize2, Minimize2, Database } from 'lucide-react';
import useSWR from 'swr';
import axios from 'axios';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { type SchemaDto, type PageDto, ENDPOINTS } from '@cms/shared';
import { PagePreviewSection } from './PagePreviewSection';
import { config } from '../../../../../config';

interface PageEditSourceProps {
    item: SchemaDto;
    pageForm: PageDto;
    onUpdateField: (field: keyof PageDto, value: any) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
}

export function PageEditSource({
    item,
    pageForm,
    onUpdateField,
    onSave,
    onCancel,
    isSaving
}: PageEditSourceProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [paramValues, setParamValues] = useState<Record<string, string>>({});

    // Identify needed params from page name
    const neededParams = (
        pageForm.name.match(/\{([^}]+)\}/g)?.map(p => p.slice(1, -1)) || []
    ).concat(
        pageForm.name.match(/:([a-zA-Z0-9_]+)/g)?.map(p => p.slice(1)) || []
    );

    const { data: pageData } = useSWR(
        item.schemaId ? [
            `${config.CMS_BASE_URL}${ENDPOINTS.QUERY.PAGE_DATA}`,
            item.schemaId,
            paramValues
        ] : null,
        ([url, id, params]) => {
            const queryParams = new URLSearchParams({ id });
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
            return axios.get(`${url}?${queryParams.toString()}`, { withCredentials: true }).then(res => res.data);
        }
    );

    return (
        <section className={`${isFullScreen ? 'fixed inset-0 z-50 bg-app p-4' : 'flex-1'} flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        HTML Content
                    </h3>

                    {/* Param Inputs */}
                    {neededParams.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary-muted uppercase">Preview Params:</span>
                            {neededParams.map(param => (
                                <input
                                    key={param}
                                    type="text"
                                    placeholder={param}
                                    value={paramValues[param] || ''}
                                    onChange={(e) => setParamValues(prev => ({ ...prev, [param]: e.target.value }))}
                                    className="h-6 w-24 px-2 text-xs bg-app-muted border border-border rounded focus:outline-none focus:border-primary transition-colors"
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isFullScreen && (
                        <>
                            <button
                                onClick={onCancel}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-app-muted hover:bg-border rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 shadow-sm"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Save className="w-3 h-3" />
                                )}
                                Save
                            </button>
                        </>
                    )}
                    <div className="w-px h-4 bg-border mx-1" />
                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-1.5 hover:bg-app-muted rounded-md text-primary-muted hover:text-primary transition-colors"
                        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                    >
                        {isFullScreen ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-row gap-4 h-full min-h-0">
                {/* Editor Pane */}
                <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
                    <div className="flex-1 border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e]">
                        <Editor
                            height="100%"
                            defaultLanguage="html"
                            value={pageForm.html}
                            onChange={(value) => onUpdateField('html', value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                                tabSize: 2,
                            }}
                        />
                    </div>

                    {isFullScreen && pageData && (
                        <div className="h-1/3 flex flex-col border border-border rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-app-surface shrink-0">
                                <Database className="w-3 h-3 text-primary-muted" />
                                <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider">Page Data (JSON)</span>
                            </div>
                            <div className="flex-1 overflow-auto p-4 bg-[#f8f9fa]">
                                <JsonView
                                    src={pageData}
                                    theme="default"
                                    displaySize={true}
                                    enableClipboard={true}
                                    collapsed={false}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Pane */}
                <div className="flex-1 h-full relative">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                    <PagePreviewSection
                        schema={item}
                        html={pageForm.html}
                        hideHeader={true}
                        paramValues={paramValues}
                    />
                </div>
            </div>
        </section>
    );
}
