import { FileCode, Trash2, Edit2, Code2 } from 'lucide-react';
import type { QueryDto } from '@cms/shared';
import { HeaderLayout } from './HeaderLayout';

interface QueryHeaderProps {
    query: QueryDto;
    schemaId: string | null;
    publicationStatus?: string;
    viewMode: 'preview' | 'json';
    onViewModeChange: (mode: 'preview' | 'json') => void;
    onDelete: () => void;
    onEdit: (tab: 'settings' | 'code') => void;
}

export function QueryHeader({ query, schemaId, publicationStatus, viewMode, onViewModeChange, onDelete, onEdit }: QueryHeaderProps) {
    return (
        <HeaderLayout
            title={query.name}
            type="query"
            schemaId={schemaId}
            publicationStatus={publicationStatus}
            icon={<FileCode className="w-5 h-5" />}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
        >
            <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-500/20"
                title="Delete Query"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => onEdit('settings')}
                className="flex items-center gap-2 px-3 py-1.5 bg-app-muted hover:bg-border text-primary rounded-lg text-xs font-bold transition-all"
            >
                <Edit2 className="w-3.5 h-3.5" />
                Settings
            </button>
            <button
                onClick={() => onEdit('code')}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-app hover:opacity-90 rounded-lg text-xs font-bold transition-all shadow-md"
            >
                <Code2 className="w-3.5 h-3.5" />
                Edit Source
            </button>
        </HeaderLayout>
    );
}
