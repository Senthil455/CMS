import { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, Layout, Sparkles, MessageSquarePlus, UserCircle, ChevronDown, Eye, TrendingUp } from 'lucide-react';
import { type PageDto, AGENT_NAMES, type PageMetadata, ENDPOINTS } from '@cms/shared';
import axios from 'axios';
import toast from 'react-hot-toast';
import { config } from '../../../../config';
import { HeaderLayout } from './HeaderLayout';

interface PageHeaderProps {
    page: PageDto;
    schemaId: string | null;
    publicationStatus?: string;
    onDelete: () => void;
    onEdit: (tab: 'settings' | 'code') => void;
    onChatAction: (action: string) => void;
}

export function PageHeader({ page, schemaId, publicationStatus, onDelete, onEdit, onChatAction }: PageHeaderProps) {
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);

    let metadata: PageMetadata = {};
    try {
        if (page.metadata) {
            metadata = JSON.parse(page.metadata);
        }
    } catch {
        // ignore
    }

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

    const handleAddEngagementBar = async () => {
        setIsAddMenuOpen(false);
        try {
            const providerName = localStorage.getItem('cms_selected_provider') || 'gemini';
            toast.loading(`Triggering Engagement Bar Generator (${providerName})...`, { id: 'engagement-bar' });
            await axios.post(`${config.API_BASE_URL}${ENDPOINTS.CHAT.ENGAGEMENT_BAR}`, {
                schemaId,
                providerName
            }, {
                withCredentials: true
            });
            toast.success('Engagement Bar Generator triggered. Check chat for progress.', { id: 'engagement-bar' });
            onChatAction(`@${AGENT_NAMES.ENGAGEMENT_BAR_GENERATOR} #${schemaId}: checking progress...`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to trigger Engagement Bar Generator', { id: 'engagement-bar' });
        }
    };

    const handleAddUserAvatar = async () => {
        setIsAddMenuOpen(false);
        try {
            const providerName = localStorage.getItem('cms_selected_provider') || 'gemini';
            toast.loading(`Triggering User Avatar Generator (${providerName})...`, { id: 'user-avatar' });
            await axios.post(`${config.API_BASE_URL}${ENDPOINTS.CHAT.USER_AVATAR}`, {
                schemaId,
                providerName
            }, {
                withCredentials: true
            });
            toast.success('User Avatar Generator triggered. Check chat for progress.', { id: 'user-avatar' });
            onChatAction(`@${AGENT_NAMES.USER_AVATAR_GENERATOR} #${schemaId}: checking progress...`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to trigger User Avatar Generator', { id: 'user-avatar' });
        }
    };

    const handleAddVisitTrack = async () => {
        setIsAddMenuOpen(false);
        try {
            const providerName = localStorage.getItem('cms_selected_provider') || 'gemini';
            toast.loading(`Triggering Visit Track Generator (${providerName})...`, { id: 'visit-track' });
            await axios.post(`${config.API_BASE_URL}${ENDPOINTS.CHAT.VISIT_TRACK}`, {
                schemaId,
                providerName
            }, {
                withCredentials: true
            });
            toast.success('Visit Track Generator triggered. Check chat for progress.', { id: 'visit-track' });
            onChatAction(`@${AGENT_NAMES.VISIT_TRACK_GENERATOR} #${schemaId}: checking progress...`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to trigger Visit Track Generator', { id: 'visit-track' });
        }
    };

    const handleAddTopList = async () => {
        setIsAddMenuOpen(false);
        try {
            const providerName = localStorage.getItem('cms_selected_provider') || 'gemini';
            toast.loading(`Triggering Top List Generator (${providerName})...`, { id: 'top-list' });
            await axios.post(`${config.API_BASE_URL}${ENDPOINTS.CHAT.TOP_LIST}`, {
                schemaId,
                providerName
            }, {
                withCredentials: true
            });
            toast.success('Top List Generator triggered. Check chat for progress.', { id: 'top-list' });
            onChatAction(`@${AGENT_NAMES.TOP_LIST_GENERATOR} #${schemaId}: checking progress...`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to trigger Top List Generator', { id: 'top-list' });
        }
    };

    // Determine page type
    const isDetailPage = metadata.plan?.pageType === 'detail';
    const isListPage = metadata.plan?.pageType === 'list';

    // Show dropdown for detail pages (all 4 features) and list pages (3 features, no engagement bar)
    // Buttons are always available so users can ask LLM to modify existing features
    const hasAddOptions = (isDetailPage || isListPage) && metadata.plan?.entityName;

    return (
        <HeaderLayout
            title={page.name}
            type="page"
            schemaId={schemaId}
            publicationStatus={publicationStatus}
            icon={<Layout className="w-5 h-5" />}
            menuItems={
                <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Page
                </button>
            }
        >
            <button
                onClick={() => onChatAction(`@${AGENT_NAMES.PAGE_PLANNER}#${schemaId}:`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg text-xs font-bold transition-all border border-purple-500/20"
            >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Ask AI to Modify
            </button>

            {hasAddOptions && (
                <div className="relative ml-1" ref={addMenuRef}>
                    <button
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg text-xs font-bold transition-all border border-blue-500/20"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Add Feature
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAddMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-app-surface border border-border rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                            {isDetailPage && (
                                <button
                                    onClick={handleAddEngagementBar}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-500/10 transition-colors text-left"
                                >
                                    <MessageSquarePlus className="w-4 h-4" />
                                    Engagement Bar
                                </button>
                            )}
                            <button
                                onClick={handleAddUserAvatar}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-green-600 hover:bg-green-500/10 transition-colors text-left"
                            >
                                <UserCircle className="w-4 h-4" />
                                User Avatar
                            </button>
                            <button
                                onClick={handleAddVisitTrack}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-500/10 transition-colors text-left"
                            >
                                <Eye className="w-4 h-4" />
                                Visit Tracking
                            </button>
                            <button
                                onClick={handleAddTopList}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-purple-600 hover:bg-purple-500/10 transition-colors text-left"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Top List
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
                    onClick={() => onEdit('code')}
                    className="flex items-center gap-2 px-3 py-1.5 text-primary-muted hover:text-primary rounded-md text-xs font-bold transition-all"
                >
                    Edit Source
                </button>
            </div>
        </HeaderLayout>
    );
}


