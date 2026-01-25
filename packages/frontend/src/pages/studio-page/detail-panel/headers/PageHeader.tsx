import { Trash2, Edit2, Layout, Sparkles, MessageSquarePlus } from 'lucide-react';
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
    let metadata: PageMetadata = {};
    try {
        if (page.metadata) {
            metadata = JSON.parse(page.metadata);
        }
    } catch {
        // ignore
    }

    const engagementBarEnabled = metadata.enableEngagementBar;

    const handleAddSocialBar = async () => {
        try {
            toast.loading('Triggering Engagement Bar Agent...', { id: 'engagement-bar' });
            await axios.post(`${config.API_BASE_URL}${ENDPOINTS.CHAT.ENGAGEMENT_BAR}`, {
                schemaId
            }, {
                withCredentials: true
            });
            toast.success('Engagement Bar Agent triggered. Check chat for progress.', { id: 'engagement-bar' });
            onChatAction(`@${AGENT_NAMES.ENGAGEMENT_BAR_AGENT} #${schemaId}: checking progress...`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to trigger Engagement Bar Agent', { id: 'engagement-bar' });
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
                onClick={() => onChatAction(`@${AGENT_NAMES.PAGE_GENERATOR}#${schemaId}:`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg text-xs font-bold transition-all border border-purple-500/20"
            >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Ask AI to Modify
            </button>

            {!engagementBarEnabled && (
                <button
                    onClick={handleAddSocialBar}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg text-xs font-bold transition-all border border-blue-500/20 ml-1"
                >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Add Social Bar
                </button>
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
