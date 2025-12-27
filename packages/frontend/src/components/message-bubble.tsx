import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { type ChatMessage } from '@cms/shared';

interface Props {
    message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 group`}>
            <div
                className={`relative max-w-[100%] md:max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${isUser
                    ? 'bg-primary text-app border-primary'
                    : 'bg-app-surface text-primary border-border'
                    }`}
            >
                <button
                    onClick={handleCopy}
                    className={`absolute top-2 right-2 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 ${isUser
                        ? 'text-app hover:bg-white/10'
                        : 'text-primary-muted hover:bg-primary/5'
                        }`}
                    title="Copy message"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </button>
                <div className="markdown-content text-sm md:text-base leading-relaxed overflow-x-auto pr-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </ReactMarkdown>
                </div>
                <div
                    className={`text-[10px] mt-1 opacity-70 ${isUser ? 'text-app' : 'text-primary-muted'
                        }`}
                >
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
}
