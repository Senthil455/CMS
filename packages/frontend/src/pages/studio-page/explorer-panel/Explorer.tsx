import { Database, Search, FileText, Layout, Activity } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchemas } from '../../../hooks/use-schemas';
import { type SchemaDto } from '@cms/shared';
import { AddEntityDialog } from './AddEntityDialog';
import { AddQueryDialog } from './AddQueryDialog';
import { ExplorerGroup } from './ExplorerGroup';

interface ExplorerProps {
    onSelectItem: (item: SchemaDto) => void;
    selectedItem: SchemaDto | null;
    onChatAction: (action: string) => void;
}

export function Explorer({ onSelectItem, selectedItem, onChatAction }: ExplorerProps) {
    const navigate = useNavigate();
    const { entities, queries, pages: allPages, isLoading, saveSchema, defineEntity } = useSchemas();
    const pages = allPages.filter(p => !p.settings.page?.components);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        entities: true,
        queries: true,
        pages: true
    });
    const [isAddEntityDialogOpen, setIsAddEntityDialogOpen] = useState(false);
    const [isAddQueryDialogOpen, setIsAddQueryDialogOpen] = useState(false);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const handleAddEntityClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAddEntityDialogOpen(true);
    };

    const handleUseAI = () => {
        setIsAddEntityDialogOpen(false);
        onChatAction('@entity_generator ');
    };

    const handleManualCreateEntity = async (name: string) => {
        setIsAddEntityDialogOpen(false);
        try {
            const result: any = await defineEntity({
                schemaId: null,
                type: 'entity',
                settings: {
                    entity: {
                        name: name,
                        displayName: name,
                        tableName: name.toLowerCase(),
                        primaryKey: 'id',
                        labelAttributeName: 'id',
                        defaultPageSize: 10,
                        defaultPublicationStatus: 'draft',
                        pageUrl: '',
                        attributes: []
                    }
                }
            });

            if (result && result.success && result.data) {
                navigate(`/app/entity/${result.data.schemaId}`);
                if (!expandedGroups.entities) {
                    setExpandedGroups(prev => ({ ...prev, entities: true }));
                }
            }
        } catch (err) {
            console.error('Failed to create entity:', err);
        }
    };

    const handleAddPage = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const result: any = await saveSchema({
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

    const handleAddQueryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAddQueryDialogOpen(true);
    };

    const handleUseAIQuery = () => {
        setIsAddQueryDialogOpen(false);
        onChatAction('@query_generator ');
    };

    const handleManualCreateQuery = async (name: string) => {
        setIsAddQueryDialogOpen(false);
        try {
            const result: any = await saveSchema({
                schemaId: null,
                type: 'query',
                settings: {
                    query: {
                        name: name,
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



    return (
        <>
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

                    <ExplorerGroup
                        label="Entities"
                        groupIcon={Database}
                        itemIcon={FileText}
                        items={entities}
                        isExpanded={expandedGroups.entities}
                        onToggle={() => toggleGroup('entities')}
                        onAdd={handleAddEntityClick}
                        onSelect={onSelectItem}
                        selectedItem={selectedItem}
                        isLoading={isLoading}
                        emptyText="No entities"
                    />

                    <ExplorerGroup
                        label="Queries"
                        groupIcon={Search}
                        itemIcon={Search}
                        items={queries}
                        isExpanded={expandedGroups.queries}
                        onToggle={() => toggleGroup('queries')}
                        onAdd={handleAddQueryClick}
                        onSelect={onSelectItem}
                        selectedItem={selectedItem}
                        isLoading={isLoading}
                        emptyText="No queries"
                    />

                    <ExplorerGroup
                        label="Pages"
                        groupIcon={Layout}
                        itemIcon={FileText}
                        items={pages}
                        isExpanded={expandedGroups.pages}
                        onToggle={() => toggleGroup('pages')}
                        onAdd={handleAddPage}
                        onSelect={onSelectItem}
                        selectedItem={selectedItem}
                        isLoading={isLoading}
                        emptyText="No pages"
                    />

                    {isLoading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        </div>
                    )}
                </div>
            </div>
            <AddEntityDialog
                isOpen={isAddEntityDialogOpen}
                onClose={() => setIsAddEntityDialogOpen(false)}
                onUseAI={handleUseAI}
                onManualCreate={handleManualCreateEntity}
            />
            <AddQueryDialog
                isOpen={isAddQueryDialogOpen}
                onClose={() => setIsAddQueryDialogOpen(false)}
                onUseAI={handleUseAIQuery}
                onManualCreate={handleManualCreateQuery}
            />
        </>
    );
}
