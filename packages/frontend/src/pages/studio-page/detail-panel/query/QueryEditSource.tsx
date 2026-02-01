import { useState } from 'react';
import { type QueryDto, type SchemaDto } from '@cms/shared';
import { Code, Maximize2, Minimize2 } from 'lucide-react';
import GraphiQL from '../../../../components/GraphiQL';

interface QueryEditSourceProps {
    item: SchemaDto;
    queryForm: QueryDto;
    updateField: (field: keyof QueryDto, value: any) => void;
}

export function QueryEditSource({ item, queryForm, updateField }: QueryEditSourceProps) {
    const [isFullscreen, setIsFullscreen] = useState(true);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <section className="flex-1 flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Query Source
                </h3>
                <button
                    onClick={toggleFullscreen}
                    className="p-1.5 hover:bg-border rounded-lg text-primary-muted hover:text-primary transition-all shadow-sm border border-border"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 h-full border border-border rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] relative">
                <GraphiQL
                    key={item.id.toString()}
                    defaultQuery={queryForm.source}
                    onEditQuery={(query: string) => {
                        updateField('source', query);
                    }}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    className="h-full w-full graphiql-container"
                    style={{ height: '100%', width: '100%' }}
                />
                {isFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="fullscreen-toggle"
                        title="Exit Fullscreen"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </section>
    );
}
