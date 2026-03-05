import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage } from '@cms/shared';
import { Calendar, Clock, User, Bot, Sparkles, Database, LayoutTemplate, PenTool, Code2, Network } from 'lucide-react';

interface Props {
    message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
    const isUser = message.role === 'user';
    const dateStr = new Date(message.createdAt).toLocaleDateString();
    const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

    // Determine agent icon based on agentName
    let AgentIcon = Bot;
    if (message.agentName === 'query_builder') {
        AgentIcon = Database;
    } else if (message.agentName === 'entity_designer') {
        AgentIcon = LayoutTemplate;
    } else if (message.agentName === 'page_architect') {
        AgentIcon = PenTool;
    } else if (message.agentName === 'page_builder') {
        AgentIcon = Code2;
    } else if (message.agentName === 'system_architect') {
        AgentIcon = Network;
    } else if (message.content.includes('Task Complete') || message.agentName === 'system') {
        AgentIcon = Sparkles;
    }

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} border-b border-border py-4 px-4 animate-in fade-in group gap-3`}>
            {isUser ? (
                // User Message Styling
                <div className="flex flex-col items-end max-w-[85%] w-full">
                    <div className="flex gap-3 w-full justify-end">
                        <div className="flex flex-col items-end w-full">
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
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                </div>
            ) : (
                // Agent Message Styling
                <div className="flex gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                        <AgentIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col w-full text-primary text-[13px]">
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
                </div>
            )}
        </div>
    );
}
