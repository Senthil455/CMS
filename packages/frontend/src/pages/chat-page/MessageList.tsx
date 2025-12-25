import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from '../../components/message-bubble';
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
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial scroll to bottom and scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages.length <= 10]); // Approximate initial load

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isReachingEnd && !isFetchingMore && !isLoading && messages.length > 0) {
                    handleInternalLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (topSentinelRef.current) {
            observer.observe(topSentinelRef.current);
        }

        return () => observer.disconnect();
    }, [isReachingEnd, isFetchingMore, isLoading, messages.length]);

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
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
            <div className="max-w-3xl mx-auto">
                <div ref={topSentinelRef} className="h-4 flex items-center justify-center mb-4">
                    {isFetchingMore && <Loader2 className="w-4 h-4 animate-spin text-primary-muted" />}
                </div>
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={scrollRef} />
            </div>
        </main>
    );
}
