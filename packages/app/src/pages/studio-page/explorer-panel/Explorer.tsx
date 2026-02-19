import { Database, Search, FileText, Layout, Activity, PanelLeftClose, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchemas } from '../../../hooks/use-schemas';
import { type SchemaDto, AGENT_NAMES } from '@cms/shared';
import { AddEntityDialog } from './AddEntityDialog';
import { AddQueryDialog } from './AddQueryDialog';
import { AddPageDialog } from './AddPageDialog';
import { ExplorerGroup } from './ExplorerGroup';

interface ExplorerProps {
    onSelectItem: (item: SchemaDto) => void;
    selectedItem: SchemaDto | null;
    onChatAction: (action: string) => void;
    onClose: () => void;
    user: any;
    logout: () => void;
}

export function Explorer({ onSelectItem, selectedItem, onChatAction, onClose, user, logout }: ExplorerProps) {
    const navigate = useNavigate();
    const { entities, queries, pages: allPages, isLoading, saveSchema, defineEntity } = useSchemas();
    const pages = allPages.filter(p => (p.settings.page?.source === 'ai'));
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        entities: true,
        queries: true,
        pages: true
    });
    const [isAddEntityDialogOpen, setIsAddEntityDialogOpen] = useState(false);
    const [isAddQueryDialogOpen, setIsAddQueryDialogOpen] = useState(false);
    const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);

    // User menu state
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        onChatAction(`@${AGENT_NAMES.ENTITY_GENERATOR} `);
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

    const handleAddPageClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAddPageDialogOpen(true);
    };

    const handleUseAIPage = () => {
        setIsAddPageDialogOpen(false);
        onChatAction(`@${AGENT_NAMES.PAGE_PLANNER} `);
    };

    const handleManualCreatePage = async (name: string) => {
        setIsAddPageDialogOpen(false);
        try {
            const result: any = await saveSchema({
                schemaId: null,
                type: 'page',
                settings: {
                    page: {
                        name: name,
                        title: name,
                        source: 'ai',
                        html: '',
                        metadata: ''
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
        onChatAction(`@${AGENT_NAMES.QUERY_GENERATOR} `);
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
                        variables: [],
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
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-xs font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-3 h-3" />
                        Explorer
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-app-muted rounded-md text-primary-muted hover:text-primary transition-colors"
                        title="Hide Explorer"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
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
                        onAdd={handleAddPageClick}
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

                {/* User Profile Section */}
                <div className="p-3 border-t border-border bg-app-surface relative" ref={menuRef}>
                    {user && (
                        <>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-app-muted transition-colors text-left group"
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-border group-hover:ring-primary/50 transition-all"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center text-white ring-1 ring-border group-hover:ring-primary/50 transition-all">
                                        <span className="text-xs font-bold">
                                            {(user.name || user.username || user.email || '?').substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate text-primary">{user.username}</p>
                                    <p className="text-[10px] text-primary-muted truncate">Workspace Active</p>
                                </div>
                                <ChevronDown className={`w-3 h-3 text-primary-muted transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute left-3 bottom-full mb-2 w-56 bg-app-surface border border-border rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                                    <div className="px-3 py-2 border-b border-border mb-1">
                                        <p className="text-xs font-bold text-primary-muted uppercase tracking-widest">Account</p>
                                    </div>
                                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-app-muted transition-colors text-xs font-medium">
                                        <UserIcon className="w-3.5 h-3.5" />
                                        Profile
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-xs font-bold"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </>
                    )
                    }
                </div >
            </div >
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
            <AddPageDialog
                isOpen={isAddPageDialogOpen}
                onClose={() => setIsAddPageDialogOpen(false)}
                onUseAI={handleUseAIPage}
                onManualCreate={handleManualCreatePage}
            />
        </>
    );
}
