import { useState } from 'react';
import { type ChatMessage } from '@cms/shared';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { AiLogsList } from './AiLogsList';
import { MessageSquare, Database } from 'lucide-react';
import { StatusBar } from '../../../components/StatusBar';

interface ChatPanelProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isReachingEnd: boolean;
    isFetchingMore: boolean;
    onLoadMore: () => Promise<void>;
    onSend: (content: string, providerName: string) => void;
    chatDraft?: string | null;
    onDraftConsumed?: () => void;
}

export function ChatPanel({
    messages,
    isLoading,
    isReachingEnd,
    isFetchingMore,
    onLoadMore,
    onSend,
    chatDraft,
    onDraftConsumed
}: ChatPanelProps) {
    const [activeTab, setActiveTab] = useState<'chat' | 'logs'>('chat');

    return (
        <div className="w-96 shrink-0 flex flex-col h-full bg-app-surface border-l border-border relative">
            <div className="p-3 border-b border-border flex items-center justify-between bg-app-surface">
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
                    <AiLogsList />
                )}
            </div>

            {activeTab === 'chat' && (
                <div className="border-t border-border bg-app-surface/50 backdrop-blur-sm">
                    <StatusBar />
                    <div className="p-4">
                        <ChatInput onSend={onSend} draft={chatDraft} onDraftConsumed={onDraftConsumed} />
                    </div>
                </div>
            )}
        </div>
    );
}
