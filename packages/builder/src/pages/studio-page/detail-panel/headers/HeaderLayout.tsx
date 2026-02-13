import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Clock, MoreVertical } from 'lucide-react';
import { SchemaHistoryDialog } from '../history/SchemaHistoryDialog';

interface HeaderLayoutProps {
    title: string;
    type: 'entity' | 'query' | 'page';
    schemaId: string | null;
    publicationStatus?: string;
    icon: ReactNode;
    children?: ReactNode;
    menuItems?: ReactNode;
}

export function HeaderLayout({
    title,
    type,
    schemaId,
    publicationStatus,
    icon,
    children,
    menuItems
}: HeaderLayoutProps) {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-1">
                    {children}
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-1.5 text-primary-muted hover:text-primary hover:bg-app-muted rounded-lg transition-colors ${isMenuOpen ? 'bg-app-muted text-primary' : ''}`}
                        title="More Actions"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-app-surface border border-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {schemaId && (
                                <button
                                    onClick={() => {
                                        setIsHistoryOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-primary hover:bg-app-muted transition-colors text-left"
                                >
                                    <Clock className="w-4 h-4 text-primary-muted" />
                                    View History
                                </button>
                            )}
                            {menuItems}
                        </div>
                    )}
                </div>

                <SchemaHistoryDialog
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    schemaId={schemaId!}
                />
            </div>
        </div>
    );
}
