import { type ReactNode, useState } from 'react';
import { Layout, Code2, Clock } from 'lucide-react';
import { SchemaHistoryDialog } from '../history/SchemaHistoryDialog';

interface HeaderLayoutProps {
    title: string;
    type: 'entity' | 'query' | 'page';
    schemaId: string | null;
    publicationStatus?: string;
    icon: ReactNode;
    viewMode: 'preview' | 'json';
    onViewModeChange: (mode: 'preview' | 'json') => void;
    children?: ReactNode;
}

export function HeaderLayout({
    title,
    type,
    schemaId,
    publicationStatus,
    icon,
    viewMode,
    onViewModeChange,
    children
}: HeaderLayoutProps) {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    return (
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-app-surface shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg ${type === 'entity' ? 'bg-primary/10 text-primary' :
                    type === 'query' ? 'bg-orange-500/10 text-orange-600' :
                        'bg-blue-500/10 text-blue-600'
                    }`}>
                    {icon}
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-bold truncate text-primary">{title}</h1>
                        {publicationStatus && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md border ${publicationStatus === 'published'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                }`}>
                                {publicationStatus}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-primary-muted uppercase font-bold tracking-wider">{type}</span>
                        {schemaId && (
                            <span className="text-[10px] text-primary-muted/50 font-mono hidden sm:inline-block">
                                #{schemaId.slice(0, 8)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {schemaId && (
                    <>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-1.5 text-primary-muted hover:text-primary hover:bg-app-muted rounded-lg transition-colors"
                            title="History"
                        >
                            <Clock className="w-4 h-4" />
                        </button>
                        <SchemaHistoryDialog
                            isOpen={isHistoryOpen}
                            onClose={() => setIsHistoryOpen(false)}
                            schemaId={schemaId}
                        />
                    </>
                )}

                <div className="h-4 w-px bg-border mx-1" />

                {children}

                <div className="h-4 w-px bg-border mx-1" />

                <div className="flex bg-app-muted p-0.5 rounded-lg">
                    <button
                        onClick={() => onViewModeChange('preview')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'preview' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                        title="Preview"
                    >
                        <Layout className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onViewModeChange('json')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'json' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                        title="JSON"
                    >
                        <Code2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
