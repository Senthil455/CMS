import { useState, useRef, useEffect } from 'react';
import {
    Trash2, Edit2, Layout, Sparkles, ChevronDown, Code,
    MessageSquarePlus, UserCircle, Eye, TrendingUp, Plus, Puzzle
} from 'lucide-react';
import { type PageDto, type PageComponentDefinition, ENDPOINTS } from '@cms/shared';
import axios from 'axios';
import { HeaderLayout } from './HeaderLayout';
// Icon lookup for dynamic addon rendering
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MessageSquarePlus,
    UserCircle,
    Eye,
    TrendingUp,
    Plus,
    Puzzle,
};

// Color class lookup
const COLOR_MAP: Record<string, { text: string; bg: string }> = {
    blue: { text: 'text-blue-600', bg: 'hover:bg-blue-500/10' },
    green: { text: 'text-green-600', bg: 'hover:bg-green-500/10' },
    orange: { text: 'text-orange-600', bg: 'hover:bg-orange-500/10' },
    purple: { text: 'text-purple-600', bg: 'hover:bg-purple-500/10' },
    red: { text: 'text-red-600', bg: 'hover:bg-red-500/10' },
    cyan: { text: 'text-cyan-600', bg: 'hover:bg-cyan-500/10' },
    pink: { text: 'text-pink-600', bg: 'hover:bg-pink-500/10' },
};

interface PageHeaderProps {
    page: PageDto;
    schemaId: string | null;
    publicationStatus?: string;
    onDelete: () => void;
    onEdit: (tab: 'settings' | 'code' | 'layout' | 'view-html') => void;
    onChatAction: (action: string) => void;
}

export function PageHeader({ page, schemaId, publicationStatus, onDelete, onEdit, onChatAction }: PageHeaderProps) {
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addons, setAddons] = useState<PageComponentDefinition[]>([]);
    const addMenuRef = useRef<HTMLDivElement>(null);

    // Fetch available addons from backend
    useEffect(() => {
        axios.get(ENDPOINTS.CHAT.PAGE_ADDONS, { withCredentials: true })
            .then(res => {
                if (res.data?.success && Array.isArray(res.data.data)) {
                    setAddons(res.data.data);
                }
            })
            .catch(err => console.warn('Failed to load page addons:', err));
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTriggerAddon = (addon: PageComponentDefinition) => {
        setIsAddMenuOpen(false);

        const message = `@page_architect#${schemaId} add a component ${addon.id}`;

        onChatAction(message);
    };

    // Determine page type
    const isDetailPage = page.pageType === 'detail';
    const isListPage = page.pageType === 'list';
    const currentPageType = isDetailPage ? 'detail' : isListPage ? 'list' : null;

    // Filter addons by current page type
    const availableAddons = currentPageType
        ? addons.filter(a => a.pageTypes.includes(currentPageType as 'detail' | 'list'))
        : [];

    const hasAddOptions = (availableAddons.length > 0 && page.entityName) || !!schemaId;

    const handleAddCustomHtml = () => {
        setIsAddMenuOpen(false);
        if (schemaId) {
            onChatAction(`@add-custom-html#${schemaId}`);
        }
    };

    return (
        <HeaderLayout
            title={page.name}
            type="page"
            schemaId={schemaId}
            publicationStatus={publicationStatus}
            icon={<Layout className="w-5 h-5" />}
            menuItems={
                <>
                    <button
                        onClick={() => onEdit('view-html')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-primary hover:bg-app-muted transition-colors text-left"
                    >
                        <Code className="w-4 h-4 text-primary-muted" />
                        View HTML
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Page
                    </button>
                </>
            }
        >
            <button
                onClick={() => onChatAction(`@page_architect#${schemaId}`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg text-xs font-bold transition-all border border-purple-500/20"
            >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Ask AI to Modify
            </button>

            {hasAddOptions && (
                <div className="relative ml-1" ref={addMenuRef}>
                    <button
                        onClick={() => setIsAddMenuOpen(prev => !prev)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg text-xs font-bold transition-all border border-blue-500/20"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Add Feature
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAddMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-app-surface border border-border rounded-lg shadow-lg z-50 min-w-[240px] py-1">
                            {availableAddons.map(addon => {
                                const IconComponent = ICON_MAP[addon.icon] || Puzzle;
                                const colors = COLOR_MAP[addon.color] || COLOR_MAP.blue;
                                return (
                                    <button
                                        key={addon.id}
                                        onClick={() => handleTriggerAddon(addon)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold ${colors.text} ${colors.bg} transition-colors text-left`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        {addon.label}
                                    </button>
                                );
                            })}

                            <div className="h-px bg-border my-1" />
                            <button
                                onClick={handleAddCustomHtml}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-500/10 transition-colors text-left"
                            >
                                <Code className="w-4 h-4" />
                                Add Custom HTML
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex bg-app-muted p-0.5 rounded-lg ml-1">
                <button
                    onClick={() => onEdit('settings')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-app-surface border border-transparent hover:border-border text-primary rounded-md text-xs font-bold transition-all shadow-sm"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                    Settings
                </button>
                <button
                    onClick={() => onEdit('layout')}
                    className="flex items-center gap-2 px-3 py-1.5 text-primary-muted hover:text-primary rounded-md text-xs font-bold transition-all"
                >
                    <Layout className="w-3.5 h-3.5" />
                    Edit Layout
                </button>
            </div>
        </HeaderLayout >
    );
}


