import { useState, useEffect, useRef } from 'react';
import { Send, Cpu, ChevronDown } from 'lucide-react';
import { useAIAgents } from '../../../hooks/use-ai-agents';

interface ChatInputProps {
    onSend: (message: string, agentName: string) => void;
    disabled?: boolean;
    draft?: string | null;
    onDraftConsumed?: () => void;
}

const STORAGE_KEY = 'cms_selected_agent';

export function ChatInput({ onSend, disabled, draft, onDraftConsumed }: ChatInputProps) {
    const [input, setInput] = useState('');
    const { agents } = useAIAgents();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedAgent, setSelectedAgent] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || 'gemini';
    });
    const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, selectedAgent);
    }, [selectedAgent]);

    useEffect(() => {
        if (draft) {
            setInput(draft);
            // Focus and move cursor to end
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(draft.length, draft.length);
            }
            onDraftConsumed?.();
        }
    }, [draft, onDraftConsumed]);

    // Update selected agent if it's no longer available, but only after agents have loaded
    useEffect(() => {
        if (agents.length > 0 && !agents.includes(selectedAgent)) {
            setSelectedAgent(agents[0]);
        }
    }, [agents, selectedAgent]);

    const handleSend = () => {
        if (!input.trim() || disabled) return;
        onSend(input, selectedAgent);
        setInput('');
    };

    return (
        <footer className="p-4 bg-app-surface border-t border-border shadow-2xl">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                            disabled={disabled || agents.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-app-muted hover:border-primary/50 transition-all text-xs font-bold shadow-sm disabled:opacity-50"
                        >
                            <Cpu className="w-3.5 h-3.5 text-primary" />
                            <span className="capitalize">{selectedAgent}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isAgentMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isAgentMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-40 bg-app-surface border border-border rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {agents.map((agent) => (
                                    <button
                                        key={agent}
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            setIsAgentMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-app-muted transition-colors capitalize ${selectedAgent === agent ? 'text-primary bg-app-muted/50' : 'text-primary-muted'}`}
                                    >
                                        {agent}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative group">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={`Message ${selectedAgent}...`}
                        className="w-full bg-app-muted border border-border rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all resize-none min-h-[60px] max-h-[200px]"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || disabled}
                        className="absolute right-3 bottom-3 p-3 bg-primary text-app rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[10px] text-primary-muted mt-2 text-center uppercase tracking-widest font-bold opacity-40">
                    Powered by CMS Architecture
                </p>
            </div>
        </footer>
    );
}
