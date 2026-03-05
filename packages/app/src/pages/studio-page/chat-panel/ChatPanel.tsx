import { useState, useEffect } from 'react';
import { type ChatMessage } from '@cms/shared';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { AiLogsList } from './AiLogsList';
import { MessageSquare, Database, AlertTriangle, Settings, Loader2, PanelRightClose } from 'lucide-react';
import { StatusBar } from '../../../components/StatusBar';
import { Link } from 'react-router-dom';

interface ChatPanelProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isReachingEnd: boolean;
    isFetchingMore: boolean;
    onLoadMore: () => Promise<void>;
    onSend: (content: string, providerName: string) => void;
    chatDraft?: string | null;
    onDraftConsumed?: () => void;
    onClose: () => void;
}

export function ChatPanel({
    messages,
    isLoading,
    isReachingEnd,
    isFetchingMore,
    onLoadMore,
    onSend,
    chatDraft,
    onDraftConsumed,
    onClose
}: ChatPanelProps) {
    const [activeTab, setActiveTab] = useState<'chat' | 'logs'>('chat');
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

    const checkConfig = async () => {
        try {
            // Check if at least either Gemini or OpenAI is configured
            const [geminiRes, openaiRes] = await Promise.all([
                fetch(`${''}/cmsapi/config/gemini`, { credentials: 'include' }).catch(() => null),
                fetch(`${''}/cmsapi/config/openai`, { credentials: 'include' }).catch(() => null)
            ]);

            let hasConfig = false;

            if (geminiRes?.ok) {
                const data = await geminiRes.json();
                if (data.data?.configured) hasConfig = true;
            }

            if (openaiRes?.ok) {
                const data = await openaiRes.json();
                if (data.data?.configured) hasConfig = true;
            }

            setIsConfigured(hasConfig);
        } catch (err) {
            console.error('Failed to check AI config', err);
            setIsConfigured(false);
        }
    };

    useEffect(() => {
        checkConfig();
    }, []);

    return (
        <div className="w-96 shrink-0 flex flex-col h-full bg-app-surface border-l border-border relative">
            <div className="p-3 border-b border-border flex items-center justify-between bg-app-surface gap-3">
                <div className="flex bg-app-muted rounded-lg p-1 w-full">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'logs' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                    >
                        <Database className="w-3.5 h-3.5" />
                        Logs
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-app-muted rounded-md text-primary-muted hover:text-primary transition-colors shrink-0"
                    title="Hide Chat"
                >
                    <PanelRightClose className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative flex flex-col">
                {activeTab === 'chat' ? (
                    <MessageList
                        messages={messages}
                        isLoading={isLoading}
                        isReachingEnd={isReachingEnd}
                        isFetchingMore={isFetchingMore}
                        onLoadMore={onLoadMore}
                    />
                ) : (
                    <AiLogsList onSwitchToChat={() => setActiveTab('chat')} onSend={onSend} />
                )}
            </div>

            {activeTab === 'chat' && (
                <div className="border-t border-border bg-app-surface/50 backdrop-blur-sm relative z-10">
                    <StatusBar />
                    <div className="p-2">
                        {isConfigured === null ? (
                            <div className="flex justify-center p-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary-muted" />
                            </div>
                        ) : isConfigured ? (
                            <ChatInput onSend={onSend} draft={chatDraft} onDraftConsumed={onDraftConsumed} />
                        ) : (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                            AI Not Configured
                                        </h4>
                                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 mb-3">
                                            To start chatting, you need to configure your AI provider API key.
                                        </p>
                                        <Link
                                            to="/app/settings"
                                            className="text-xs font-medium px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors inline-flex items-center gap-1.5"
                                        >
                                            <Settings className="w-3 h-3" />
                                            Go to Settings
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
