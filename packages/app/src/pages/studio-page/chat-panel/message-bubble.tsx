import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage } from '@cms/shared';
import { Calendar, Clock, User, Bot, Sparkles, Database, LayoutTemplate, PenTool, Code2, Network, Beaker } from 'lucide-react';

interface Props {
    message: ChatMessage;
}

export function getAgentIcon(agentName: string | undefined, content?: string) {
    let AgentIcon = Bot;
    if (agentName === 'query_builder') {
        AgentIcon = Database;
    } else if (agentName === 'entity_designer') {
        AgentIcon = LayoutTemplate;
    } else if (agentName === 'page_architect') {
        AgentIcon = PenTool;
    } else if (agentName === 'page_builder') {
        AgentIcon = Code2;
    } else if (agentName === 'system_architect') {
        AgentIcon = Network;
    } else if (agentName === 'data_synthesizer') {
        AgentIcon = Beaker;
    } else if ((content && content.includes('Task Complete')) || agentName === 'system') {
        AgentIcon = Sparkles;
    }
    return AgentIcon;
}

export function MessageBubble({ message }: Props) {
    const isUser = message.role === 'user';
    const dateStr = new Date(message.createdAt).toLocaleDateString();
    const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

    // Determine agent icon based on agentName
    const AgentIcon = getAgentIcon(message.agentName, message.content);

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} border-b border-border py-4 px-4 animate-in fade-in group gap-3`}>
            {isUser ? (
                // User Message Styling
                <div className="flex flex-col items-end max-w-[85%] w-full min-w-0">
                    <div className="flex gap-3 w-full justify-end min-w-0">
                        <div className="flex flex-col items-end w-full min-w-0">
                            <div className="relative rounded-lg px-3 py-2 bg-secondary text-secondary-foreground text-[13px] shadow-sm mb-2 max-w-full">
                                <div className="whitespace-pre-wrap break-words leading-relaxed pr-2">
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
                <div className="flex gap-3 w-full min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                        <AgentIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col w-full text-primary text-[13px] min-w-0">
                        <div className="markdown-content break-words leading-relaxed overflow-x-auto pr-2 mb-2">
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
