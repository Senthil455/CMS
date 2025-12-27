import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { type ChatMessage, type SchemaSummary } from '@cms/shared';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SchemaConfirmationModal } from '../schema-confirmation-modal';

export default function ChatPage() {
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { user, logout } = useAuth();
    const { history, isLoading, size, setSize, isReachingEnd, isFetchingMore } = useChatHistory();
    const { sendMessage, sendSchemaResponse, onNewMessage, onSchemaSummaryToConfirm } = useSocket();
    const [isDark, setIsDark] = useState(false);

    // Schema Confirmation State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState<SchemaSummary | null>(null);

    useEffect(() => {
        if (history) {
            // Dedup history just in case
            const uniqueHistory = Array.from(new Map(history.map(m => [m.id, m])).values());
            setLocalMessages(uniqueHistory);
        }
    }, [history]);

    useEffect(() => {
        const unsubNew = onNewMessage((msg: ChatMessage) => {
            setLocalMessages((prev) => {
                // Ensure we don't add duplicates (checking both number and string equality just in case)
                if (prev.some((m) => m.id == msg.id)) return prev;
                return [...prev, msg];
            });
        });

        const unsubConfirm = onSchemaSummaryToConfirm((data) => {
            console.log(data);
            setConfirmationData(data);
            setShowConfirmation(true);
        });

        return () => {
            unsubNew();
            unsubConfirm();
        };
    }, [onNewMessage, onSchemaSummaryToConfirm]);

    const handleSend = (content: string, agentName: string) => {
        sendMessage(content, agentName);
    };

    const handleConfirmSchema = (response: SchemaSummary) => {
        sendSchemaResponse(response);
        setShowConfirmation(false);
        setConfirmationData(null);
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className="flex flex-col h-screen bg-app transition-colors duration-300">
            <ChatHeader
                user={user}
                logout={logout}
                isDark={isDark}
                toggleTheme={toggleTheme}
            />

            <MessageList
                messages={localMessages}
                isLoading={isLoading}
                isReachingEnd={!!isReachingEnd}
                isFetchingMore={!!isFetchingMore}
                onLoadMore={async () => { await setSize(size + 1); }}
            />

            <ChatInput onSend={handleSend} />

            <SchemaConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmSchema}
                schemaSummary={confirmationData || { summary: '', entities: [], relationships: [] }}
            />
        </div>
    );
}
