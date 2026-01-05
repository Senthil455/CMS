import { ChevronRight, ChevronDown, Database, Search, FileText, Layout, Activity, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchemas } from '../../hooks/use-schemas';
import { type SchemaDto } from '@cms/shared';

interface ExplorerProps {
    onSelectItem: (item: SchemaDto) => void;
    selectedItem: SchemaDto | null;
    onChatAction: (action: string) => void;
}

export function Explorer({ onSelectItem, selectedItem, onChatAction }: ExplorerProps) {
    const navigate = useNavigate();
    const { entities, queries, pages: allPages, isLoading, saveEntity } = useSchemas();
    const pages = allPages.filter(p => !p.settings.page?.components);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        entities: true,
        queries: true,
        pages: true
    });

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const handleAddEntity = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChatAction('@entity_generator ');
    };

    const handleAddPage = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const result: any = await saveEntity({
                schemaId: null,
                type: 'page',
                settings: {
                    page: {
                        name: 'New Page',
                        title: 'New Page',
                        query: '',
                        html: '<div>New Page</div>',
                        css: '',
                        components: '[]',
                        styles: ''
                    }
                }
            });

            if (result && result.success && result.data) {
                navigate(`/app/page/${result.data.schemaId}`);
                if (!expandedGroups.pages) {
                    setExpandedGroups(prev => ({ ...prev, pages: true }));
                }
            }
        } catch (err) {
            console.error('Failed to create page:', err);
        }
    };

    const handleAddQuery = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const result: any = await saveEntity({
                schemaId: null,
                type: 'query',
                settings: {
                    query: {
                        name: 'New Query',
                        entityName: '',
                        source: '',
                        filters: [],
                        sorts: [],
                        reqVariables: [],
                        distinct: false,
                        ideUrl: '',
                        pagination: { offset: '0', limit: '10' }
                    }
                }
            });

            if (result && result.success && result.data) {
                navigate(`/app/query/${result.data.schemaId}`);
                if (!expandedGroups.queries) {
                    setExpandedGroups(prev => ({ ...prev, queries: true }));
                }
            }
        } catch (err) {
            console.error('Failed to create query:', err);
        }
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
                {/* Overview */}
                <button
                    onClick={() => navigate('/app/overview')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors rounded-lg hover:bg-app-muted text-primary-muted hover:text-primary mb-2"
                >
                    <Activity className="w-4 h-4" />
                    <span className="font-medium">Overview</span>
                </button>
                {/* Entities */}
                <div>
                    <button
                        onClick={() => toggleGroup('entities')}
                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-app-muted rounded-lg text-sm font-semibold text-primary/80"
                    >
                        {expandedGroups.entities ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Database className="w-4 h-4" />
                        <span>Entities</span>

                        <div className="ml-auto flex items-center gap-1">
                            <div
                                role="button"
                                onClick={handleAddEntity}
                                className="p-1 rounded bg-primary/5 hover:bg-primary/20 text-primary transition-colors"
                                title="Create Entity"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{entities.length}</span>
                        </div>
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
                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-app-muted rounded-lg text-sm font-semibold text-primary/80 group"
                    >
                        {expandedGroups.queries ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Search className="w-4 h-4" />
                        <span>Queries</span>

                        <div className="ml-auto flex items-center gap-1">
                            <div
                                role="button"
                                onClick={handleAddQuery}
                                className="p-1 rounded bg-primary/5 hover:bg-primary/20 text-primary transition-colors"
                                title="Create Query"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{queries.length}</span>
                        </div>
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

                        <div className="ml-auto flex items-center gap-1">
                            <div
                                role="button"
                                onClick={handleAddPage}
                                className="p-1 rounded bg-primary/5 hover:bg-primary/20 text-primary transition-colors"
                                title="Create Page"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{pages.length}</span>
                        </div>
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
