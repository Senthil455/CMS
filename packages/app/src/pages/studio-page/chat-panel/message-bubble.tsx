import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage } from '@cms/shared';
import { Calendar, Clock } from 'lucide-react';

interface Props {
    message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
    const isUser = message.role === 'user';
    const dateStr = new Date(message.createdAt).toLocaleDateString();
    const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} border-b border-border py-4 px-4 animate-in fade-in group`}>
            {isUser ? (
                // User Message Styling (Matching IDE chat user prompt style)
                <div className="flex flex-col items-end max-w-[85%]">
                    <div className="relative rounded-lg px-3 py-2 bg-secondary text-secondary-foreground text-[13px] shadow-sm mb-2">
                        <div className="whitespace-pre-wrap leading-relaxed pr-2">
                            {message.content}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-primary-muted opacity-80">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{timeStr}</span>
                        </div>
                    </div>
                </div>
            ) : (
                // Agent Message Styling (Matching IDE chat assistant response style)
                <div className="relative w-full text-primary text-[13px]">
                    <div className="markdown-content leading-relaxed overflow-x-auto pr-2 mb-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-primary-muted opacity-80">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{timeStr}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
