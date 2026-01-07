import type { ReactNode } from 'react';
import { Layout, Code2 } from 'lucide-react';

interface HeaderLayoutProps {
    title: string;
    type: string;
    schemaId: string;
    icon: ReactNode;
    viewMode: 'preview' | 'json';
    onViewModeChange: (mode: 'preview' | 'json') => void;
    children?: ReactNode;
}

export function HeaderLayout({
    title,
    type,
    schemaId,
    icon,
    viewMode,
    onViewModeChange,
    children
}: HeaderLayoutProps) {
    return (
        <div className="p-4 border-b border-border flex items-center justify-between bg-app-surface shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-bold">{title}</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-app-muted rounded-full text-primary-muted font-medium uppercase tracking-wider">
                            {type}
                        </span>
                        <span className="text-xs text-primary-muted font-mono">{schemaId}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex bg-app-muted p-1 rounded-lg">
                    <button
                        onClick={() => onViewModeChange('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                    >
                        <Layout className="w-3.5 h-3.5" />
                        Preview
                    </button>
                    <button
                        onClick={() => onViewModeChange('json')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'json' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        JSON
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}
