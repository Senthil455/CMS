import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { useSchemas } from '../../hooks/use-schemas';
import { type ChatMessage, type SchemaSummary, type SchemaDto, type SaveEntityPayload } from '@cms/shared';
import { StudioHeader } from './StudioHeader';
import { Explorer } from './Explorer';
import { DetailView } from './detail-panel/DetailView';
import { DetailEdit } from './detail-panel/DetailEdit';
import { ChatPanel } from './chat-panel/ChatPanel';
import { SchemaConfirmationModal } from './chat-panel/entity-confirm';

export default function StudioPage() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const { entities, queries, pages, saveEntity } = useSchemas();
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { user, logout } = useAuth();
    const { history, isLoading: chatLoading, size, setSize, isReachingEnd, isFetchingMore } = useChatHistory();
    const { sendMessage, sendSchemaResponse, onNewMessage, onSchemaSummaryToConfirm } = useSocket();
    const [isDark, setIsDark] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const selectedItem = useMemo(() => {
        if (!type || !id) return null;
        if (type === 'entity') return entities.find(e => e.schemaId === id) || null;
        if (type === 'query') return queries.find(q => q.schemaId === id) || null;
        if (type === 'page') return pages.find(p => p.schemaId === id) || null;
        return null;
    }, [type, id, entities, queries, pages]);

    useEffect(() => {
        setIsEditing(false);
    }, [id, type]);

    const handleSelectItem = (item: SchemaDto | null) => {
        if (item) {
            navigate(`/app/${item.type}/${item.schemaId}`);
        } else {
            navigate('/app');
        }
    };

    const handleSaveEntity = async (payload: SaveEntityPayload) => {
        await saveEntity(payload);
        setIsEditing(false);
    };

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
        <div className="flex flex-col h-screen bg-app transition-colors duration-300 overflow-hidden">
            <StudioHeader
                user={user}
                logout={logout}
                isDark={isDark}
                toggleTheme={toggleTheme}
            />

            <div className="flex flex-1 overflow-hidden">
                <Explorer
                    onSelectItem={handleSelectItem}
                    selectedItem={selectedItem}
                />

                {isEditing && selectedItem ? (
                    <DetailEdit
                        item={selectedItem}
                        onSave={handleSaveEntity}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <DetailView
                        item={selectedItem}
                        onEdit={() => setIsEditing(true)}
                    />
                )}

                <ChatPanel
                    messages={localMessages}
                    isLoading={chatLoading}
                    isReachingEnd={!!isReachingEnd}
                    isFetchingMore={!!isFetchingMore}
                    onLoadMore={async () => { await setSize(size + 1); }}
                    onSend={handleSend}
                />
            </div>

            <SchemaConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmSchema}
                schemaSummary={confirmationData || { summary: '', entities: [], relationships: [] }}
            />
        </div>
    );
}

