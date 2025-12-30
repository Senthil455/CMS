import { ChevronRight, ChevronDown, Database, Search, FileText, Layout } from 'lucide-react';
import { useState } from 'react';
import { useSchemas } from '../../hooks/use-schemas';
import { type SchemaDto } from '@cms/shared';

interface ExplorerProps {
    onSelectItem: (item: SchemaDto) => void;
    selectedItem: SchemaDto | null;
}

export function Explorer({ onSelectItem, selectedItem }: ExplorerProps) {
    const { entities, queries, pages, isLoading } = useSchemas();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        entities: true,
        queries: true,
        pages: true
    });

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const renderItem = (item: SchemaDto, icon: any) => {
        const isSelected = selectedItem?.schemaId === item.schemaId;
        const Icon = icon;

        return (
            <div
                key={item.schemaId}
                onClick={() => onSelectItem(item)}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors rounded-lg overflow-hidden whitespace-nowrap overflow-ellipsis ${isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-app-muted text-primary-muted hover:text-primary'
                    }`}
                title={item.name}
            >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-app-surface border-r border-border w-64 shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-border">
                <h2 className="text-xs font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" />
                    Explorer
                </h2>
            </div>

            <div className="flex-1 py-4 flex flex-col gap-2 px-2">
                {/* Entities */}
                <div>
                    <button
                        onClick={() => toggleGroup('entities')}
                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-app-muted rounded-lg text-sm font-semibold text-primary/80"
                    >
                        {expandedGroups.entities ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Database className="w-4 h-4" />
                        <span>Entities</span>
                        <span className="ml-auto text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{entities.length}</span>
                    </button>
                    {expandedGroups.entities && (
                        <div className="mt-1 flex flex-col gap-0.5 ml-4">
                            {entities.map(item => renderItem(item, FileText))}
                            {entities.length === 0 && !isLoading && <div className="text-[10px] text-primary-muted px-3 py-1 italic">No entities</div>}
                        </div>
                    )}
                </div>

                {/* Queries */}
                <div>
                    <button
                        onClick={() => toggleGroup('queries')}
                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-app-muted rounded-lg text-sm font-semibold text-primary/80"
                    >
                        {expandedGroups.queries ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Search className="w-4 h-4" />
                        <span>Queries</span>
                        <span className="ml-auto text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{queries.length}</span>
                    </button>
                    {expandedGroups.queries && (
                        <div className="mt-1 flex flex-col gap-0.5 ml-4">
                            {queries.map(item => renderItem(item, Search))}
                            {queries.length === 0 && !isLoading && <div className="text-[10px] text-primary-muted px-3 py-1 italic">No queries</div>}
                        </div>
                    )}
                </div>

                {/* Pages */}
                <div>
                    <button
                        onClick={() => toggleGroup('pages')}
                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-app-muted rounded-lg text-sm font-semibold text-primary/80"
                    >
                        {expandedGroups.pages ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Layout className="w-4 h-4" />
                        <span>Pages</span>
                        <span className="ml-auto text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{pages.length}</span>
                    </button>
                    {expandedGroups.pages && (
                        <div className="mt-1 flex flex-col gap-0.5 ml-4">
                            {pages.map(item => renderItem(item, FileText))}
                            {pages.length === 0 && !isLoading && <div className="text-[10px] text-primary-muted px-3 py-1 italic">No pages</div>}
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
