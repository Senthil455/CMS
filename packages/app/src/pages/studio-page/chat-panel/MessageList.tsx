import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { type ChatMessage } from '@cms/shared';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    isReachingEnd: boolean;
    isFetchingMore: boolean;
    onLoadMore: () => Promise<void>;
}

export function MessageList({ messages, isLoading, isReachingEnd, isFetchingMore, onLoadMore }: MessageListProps) {
    const mainRef = useRef<HTMLElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInitialScrollDone = useRef(false);

    // Initial scroll to bottom
    useEffect(() => {
        if (!isLoading && messages.length > 0 && !isInitialScrollDone.current) {
            const timer = setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'auto' });
                isInitialScrollDone.current = true;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages.length, isLoading]);

    const lastMessage = messages[messages.length - 1];

    // Scroll to bottom on new messages (if already at bottom or if it's a new message from user/agent)
    useEffect(() => {
        if (isInitialScrollDone.current && messages.length > 0) {
            // We can be more sophisticated here, but for now just scroll to bottom on every change 
            // if we are already near the bottom or if it's a new message.
            // Simplified: scroll to bottom on length change if it's not a "load more" action.
            // Since "load more" is handled in handleInternalLoadMore with custom scroll maintenance,
            // this effect will handle regular new messages.
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [lastMessage?.id, lastMessage?.content]);

    const handleInternalLoadMore = async () => {
        const scrollContainer = mainRef.current;
        const previousScrollHeight = scrollContainer?.scrollHeight || 0;

        await onLoadMore();

        // Maintain scroll position after state update
        requestAnimationFrame(() => {
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight;
            }
        });
    };

    if (isLoading) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center text-primary-muted gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">Loading chat history...</p>
            </main>
        );
    }

    return (
        <main ref={mainRef} className="flex-1 overflow-y-auto px-1 py-2">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center mb-6">
                    {!isReachingEnd && (
                        <button
                            onClick={handleInternalLoadMore}
                            disabled={isFetchingMore}
                            className="text-xs font-semibold px-4 py-2 bg-secondary hover:bg-secondary-hover text-secondary-foreground rounded-full transition-all duration-200 flex items-center gap-2 border border-border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isFetchingMore ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <span className="group-hover:-translate-y-0.5 transition-transform duration-200 mt-0.5">↑</span>
                                    <span>Load earlier messages</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={scrollRef} />
            </div>
        </main>
    );
}
