import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput('');
    };

    return (
        <footer className="p-4 bg-app-surface border-t border-border shadow-2xl">
            <div className="max-w-3xl mx-auto">
                <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Describe your database schema requirements..."
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
