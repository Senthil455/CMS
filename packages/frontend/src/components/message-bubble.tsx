import { type ChatMessage } from '@cms/shared';

interface Props {
    message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm border ${isUser
                    ? 'bg-primary text-app border-primary'
                    : 'bg-app-surface text-primary border-border'
                    }`}
            >
                <div className="text-sm md:text-base leading-relaxed">{message.content}</div>
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
