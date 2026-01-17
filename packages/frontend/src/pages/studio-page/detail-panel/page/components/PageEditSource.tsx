import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, X, Save, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { type SchemaDto, type PageDto } from '@cms/shared';
import { PagePreviewSection } from './PagePreviewSection';

interface PageEditSourceProps {
    item: SchemaDto;
    pageForm: PageDto;
    onUpdateField: (field: keyof PageDto, value: any) => void;
    onSave: () => void;
    onCancel: () => void;
    onChatAction: (action: string) => void;
    isSaving: boolean;
}

export function PageEditSource({
    item,
    pageForm,
    onUpdateField,
    onSave,
    onCancel,
    onChatAction,
    isSaving
}: PageEditSourceProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);

    return (
        <section className={`${isFullScreen ? 'fixed inset-0 z-50 bg-app p-4' : 'flex-1'} flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4 shrink-0">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    HTML Content
                </h3>
                <div className="flex items-center gap-2">
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
                    <button
                        onClick={() => onChatAction(`@page_generate#${item.schemaId}: `)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                    >
                        <Sparkles className="w-3 h-3" />
                        Ask AI
                    </button>
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
                <div className="flex-1 h-full border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e]">
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

                {/* Preview Pane */}
                <div className="flex-1 h-full relative">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                    <PagePreviewSection
                        schema={item}
                        html={pageForm.html}
                        hideHeader={true}
                    />
                </div>
            </div>
        </section>
    );
}
