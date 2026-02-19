import { Save, Sun, Moon, Settings, FolderTree, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudioHeaderProps {
    isDark: boolean;
    toggleTheme: () => void;
    showExplorer: boolean;
    onToggleExplorer: () => void;
    showChat: boolean;
    onToggleChat: () => void;
}

export function StudioHeader({ isDark, toggleTheme, showExplorer, onToggleExplorer, showChat, onToggleChat }: StudioHeaderProps) {

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-app-surface/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <Link to="/app" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <Save className="text-white dark:text-black w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Cms SchemaGen AI</h1>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleExplorer}
                    className={`p-2 hover:bg-app-muted rounded-full transition-colors border border-transparent hover:border-border ${!showExplorer ? 'bg-app-muted border-border' : ''}`}
                    title={showExplorer ? "Hide Explorer" : "Show Explorer"}
                >
                    <FolderTree className="w-5 h-5 text-primary-muted hover:text-primary transition-colors" />
                </button>
                <button
                    onClick={onToggleChat}
                    className={`p-2 hover:bg-app-muted rounded-full transition-colors border border-transparent hover:border-border ${!showChat ? 'bg-app-muted border-border' : ''}`}
                    title={showChat ? "Hide Chat" : "Show Chat"}
                >
                    <MessageSquare className="w-5 h-5 text-primary-muted hover:text-primary transition-colors" />
                </button>
                <Link
                    to="/app/settings"
                    className="p-2 hover:bg-app-muted rounded-full transition-colors border border-transparent hover:border-border text-primary-muted hover:text-primary"
                    title="System Settings"
                >
                    <Settings className="w-5 h-5" />
                </Link>
                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-app-muted rounded-full transition-colors border border-border"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

            </div>
        </header>
    );
}
