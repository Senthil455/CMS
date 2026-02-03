import { useState, useRef, useEffect } from 'react';
import { Save, Sun, Moon, LogOut, Settings, User as UserIcon, ChevronDown, Database, PanelLeft, PanelRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudioHeaderProps {
    user: any;
    logout: () => void;
    isDark: boolean;
    toggleTheme: () => void;
    showExplorer: boolean;
    onToggleExplorer: () => void;
    showChat: boolean;
    onToggleChat: () => void;
}

export function StudioHeader({ user, logout, isDark, toggleTheme, showExplorer, onToggleExplorer, showChat, onToggleChat }: StudioHeaderProps) {
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

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-app-surface/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleExplorer}
                    className={`p-2 hover:bg-app-muted rounded-lg transition-colors border border-transparent hover:border-border ${!showExplorer ? 'bg-app-muted border-border' : ''}`}
                    title={showExplorer ? "Hide Explorer" : "Show Explorer"}
                >
                    <PanelLeft className="w-5 h-5 text-primary-muted hover:text-primary transition-colors" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <Save className="text-white dark:text-black w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Cms SchemaGen AI</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleChat}
                    className={`p-2 hover:bg-app-muted rounded-full transition-colors border border-transparent hover:border-border ${!showChat ? 'bg-app-muted border-border' : ''}`}
                    title={showChat ? "Hide Chat" : "Show Chat"}
                >
                    <PanelRight className="w-5 h-5 text-primary-muted hover:text-primary transition-colors" />
                </button>
                <Link
                    to="/app/ai-logs"
                    className="p-2 hover:bg-app-muted rounded-full transition-colors border border-border text-primary flex items-center gap-2 px-3 shadow-sm hover:border-primary/50"
                    title="View AI Logs"
                >
                    <Database className="w-5 h-5" />
                    <span className="text-xs font-bold hidden sm:inline">AI Logs</span>
                </Link>
                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-app-muted rounded-full transition-colors border border-border"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {user && (
                    <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border relative" ref={menuRef}>
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold truncate max-w-[120px]">{user.username}</span>
                            <span className="text-[10px] text-primary-muted uppercase tracking-wider font-medium">Workspace Active</span>
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="relative group cursor-pointer active:scale-95 transition-transform flex items-center gap-1"
                        >
                            <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all shadow-md"
                            />
                            <ChevronDown className={`w-4 h-4 text-primary-muted transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-app-surface border border-border rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                                <div className="px-4 py-2 border-b border-border mb-1">
                                    <p className="text-xs font-bold text-primary-muted uppercase tracking-widest">Account</p>
                                </div>
                                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-app-muted transition-colors text-sm font-medium">
                                    <UserIcon className="w-4 h-4" />
                                    Profile
                                </button>
                                <Link to="/app/settings" className="w-full flex items-center gap-3 px-4 py-2 hover:bg-app-muted transition-colors text-sm font-medium">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <div className="h-px bg-border my-1" />
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors text-sm font-bold"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
