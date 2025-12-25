import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, Sun, Moon, LogOut, Settings, User as UserIcon, ChevronDown, Database } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { MessageBubble } from '../../components/message-bubble';
import { type ChatMessage } from '@cms/shared';
import { Link } from 'react-router-dom';

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { user, logout } = useAuth();
    const { history, isLoading, loadMore } = useChatHistory();
    const { sendMessage, onNewMessage, onMessageSaved } = useSocket();
    const scrollRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isDark, setIsDark] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (history) {
            setLocalMessages(history);
            if (history.length < 10) setHasMore(false);
            // On initial load, scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
        }
    }, [history]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading && localMessages.length > 0) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (topSentinelRef.current) {
            observer.observe(topSentinelRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, isLoading, localMessages]);

    const handleLoadMore = async () => {
        if (!hasMore || isFetchingMore || localMessages.length === 0) return;

        setIsFetchingMore(true);
        const firstMessageId = localMessages[0].id;

        // Save current scroll height to maintain position
        const scrollContainer = mainRef.current;
        const previousScrollHeight = scrollContainer?.scrollHeight || 0;

        try {
            const moreMessages = await loadMore(Number(firstMessageId));
            if (moreMessages.length < 10) {
                setHasMore(false);
            }

            if (moreMessages.length > 0) {
                setLocalMessages(prev => [...moreMessages, ...prev]);

                // Maintain scroll position after state update
                requestAnimationFrame(() => {
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        const unsubNew = onNewMessage((msg: ChatMessage) => {
            setLocalMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Scroll to bottom only if it's a new message
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        const unsubSaved = onMessageSaved((data) => {
            if (data.success) {
                setStatus('Requirement saved to database');
                setTimeout(() => setStatus(null), 3000);
            }
        });

        return () => {
            unsubNew();
            unsubSaved();
        };
    }, [onNewMessage, onMessageSaved]);

    /* Old scroll effect removed to avoid jumping during pagination */

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className="flex flex-col h-screen bg-app transition-colors duration-300">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-app-surface/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <Save className="text-white dark:text-black w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Cms SchemaGen AI</h1>
                </div>

                <div className="flex items-center gap-4">
                    {status && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full border border-green-200 dark:border-green-800 shadow-sm animate-in fade-in zoom-in">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {status}
                        </div>
                    )}
                    <Link
                        to="/ai-logs"
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
                                    <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-app-muted transition-colors text-sm font-medium">
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
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

            {/* Main Chat Area */}
            <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-primary-muted gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm font-medium">Loading chat history...</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <div ref={topSentinelRef} className="h-4 flex items-center justify-center mb-4">
                            {isFetchingMore && <Loader2 className="w-4 h-4 animate-spin text-primary-muted" />}
                        </div>
                        {localMessages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={scrollRef} />
                    </div>
                )}
            </main>

            {/* Input Area */}
            <footer className="p-4 bg-app-surface border-t border-border shadow-2xl">
                <div className="max-w-3xl mx-auto">
                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Describe your database schema requirements..."
                            className="w-full bg-app-muted border border-border rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all resize-none min-h-[60px] max-h-[200px]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="absolute right-3 bottom-3 p-3 bg-primary text-app rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[10px] text-primary-muted mt-2 text-center uppercase tracking-widest font-bold opacity-40">
                        Powered by CMS Architecture
                    </p>
                </div>
            </footer>
        </div>
    );
}
