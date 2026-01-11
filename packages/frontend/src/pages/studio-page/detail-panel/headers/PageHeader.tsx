import { Trash2, Edit2, Layout, Sparkles } from 'lucide-react';
import type { PageDto } from '@cms/shared';
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
                onClick={() => onChatAction(`@page_generator#${page.name}:`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg text-xs font-bold transition-all border border-purple-500/20"
            >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Ask AI to Modify
            </button>

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
