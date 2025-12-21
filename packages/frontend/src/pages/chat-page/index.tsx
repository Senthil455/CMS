import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Save, Sun, Moon } from 'lucide-react';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { MessageBubble } from '../../components/message-bubble';
import { type ChatMessage } from '@cms/shared';

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { history, isLoading, mutate } = useChatHistory();
    const { sendMessage, onNewMessage, onMessageSaved } = useSocket();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (history) setLocalMessages(history);
    }, [history]);

    useEffect(() => {
        const unsubNew = onNewMessage((msg) => {
            setLocalMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
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

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages]);

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
                    <h1 className="text-xl font-bold tracking-tight">SchemaGen AI</h1>
                </div>

                <div className="flex items-center gap-4">
                    {status && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full border border-green-200 dark:border-green-800 shadow-sm animate-in fade-in zoom-in">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {status}
                        </div>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-app-muted rounded-full transition-colors border border-border"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-primary-muted gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm font-medium">Loading chat history...</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
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
