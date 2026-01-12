import { type ChatMessage } from '@cms/shared';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { MessageSquare } from 'lucide-react';

interface ChatPanelProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isReachingEnd: boolean;
    isFetchingMore: boolean;
    onLoadMore: () => Promise<void>;
    onSend: (content: string, agentName: string) => void;
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
    return (
        <div className="w-96 shrink-0 flex flex-col h-full bg-app-surface border-l border-border relative">
            <div className="p-4 border-b border-border flex items-center gap-2 bg-app-surface">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold">Chat Panel</h2>
            </div>

            <div className="flex-1 overflow-hidden relative flex flex-col">
                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    isReachingEnd={isReachingEnd}
                    isFetchingMore={isFetchingMore}
                    onLoadMore={onLoadMore}
                />
            </div>

            <div className="p-4 border-t border-border bg-app-surface/50 backdrop-blur-sm">
                <ChatInput onSend={onSend} draft={chatDraft} onDraftConsumed={onDraftConsumed} />
            </div>
        </div>
    );
}
