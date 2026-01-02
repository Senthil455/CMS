import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { useSchemas } from '../../hooks/use-schemas';
import { type ChatMessage, type SchemaSummary, type SchemaDto, type SaveSchemaPayload } from '@cms/shared';
import { StudioHeader } from './StudioHeader';
import { Explorer } from './Explorer';
import { DetailView } from './detail-panel/DetailView';
import { EntityEdit } from './detail-panel/EntityEdit';
import { QueryEdit } from './detail-panel/QueryEdit';
import { PageEdit } from './detail-panel/PageEdit';
import { ChatPanel } from './chat-panel/ChatPanel';
import { SchemaConfirmationModal } from './chat-panel/entity-confirm';

export default function StudioPage() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const { entities, queries, pages, saveEntity } = useSchemas();
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { user, logout } = useAuth();
    const { history, isLoading: chatLoading, size, setSize, isReachingEnd, isFetchingMore } = useChatHistory();
    const { sendMessage, sendSchemaResponse, onNewMessage, onSchemaSummaryToConfirm } = useSocket();
    const [isDark, setIsDark] = useState(false);
    const [showExplorer, setShowExplorer] = useState(true);
    const [showChat, setShowChat] = useState(true);

    const isEditing = location.pathname.endsWith('/edit');
    const editTab = (searchParams.get('tab') as 'settings' | 'code') || 'settings';

    const selectedItem = useMemo(() => {
        if (!type || !id) return null;
        if (type === 'entity') return entities.find(e => e.schemaId === id) || null;
        if (type === 'query') return queries.find(q => q.schemaId === id) || null;
        if (type === 'page') return pages.find(p => p.schemaId === id) || null;
        return null;
    }, [type, id, entities, queries, pages]);

    const handleSelectItem = (item: SchemaDto | null) => {
        if (item) {
            navigate(`/app/${item.type}/${item.schemaId}`);
        } else {
            navigate('/app');
        }
    };

    const handleSaveEntity = async (payload: SaveSchemaPayload) => {
        await saveEntity(payload);
        navigate(`/app/${payload.type}/${payload.schemaId || id}`);
    };

    const { deleteSchema } = useSchemas();

    const handleDelete = async () => {
        if (!selectedItem) return;

        if (window.confirm(`Are you sure you want to delete ${selectedItem.name}? This action cannot be undone.`)) {
            try {
                await deleteSchema(selectedItem.id);
                navigate('/app');
            } catch (error) {
                console.error('Failed to delete:', error);
                alert('Failed to delete item');
            }
        }
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
                showExplorer={showExplorer}
                onToggleExplorer={() => setShowExplorer(!showExplorer)}
                showChat={showChat}
                onToggleChat={() => setShowChat(!showChat)}
            />

            <div className="flex flex-1 overflow-hidden">
                {showExplorer && (
                    <Explorer
                        onSelectItem={handleSelectItem}
                        selectedItem={selectedItem}
                    />
                )}

                {isEditing && selectedItem ? (
                    <>
                        {selectedItem.type === 'entity' && (
                            <EntityEdit
                                item={selectedItem}
                                onSave={handleSaveEntity}
                                onCancel={() => navigate(`/app/${selectedItem.type}/${selectedItem.schemaId}`)}
                            />
                        )}
                        {selectedItem.type === 'query' && (
                            <QueryEdit
                                item={selectedItem}
                                initialTab={editTab}
                                onTabChange={(tab) => setSearchParams({ tab })}
                                onSave={handleSaveEntity}
                                onCancel={() => navigate(`/app/${selectedItem.type}/${selectedItem.schemaId}`)}
                            />
                        )}
                        {selectedItem.type === 'page' && (
                            <PageEdit
                                item={selectedItem}
                                initialTab={editTab}
                                onTabChange={(tab) => setSearchParams({ tab })}
                                onSave={handleSaveEntity}
                                onCancel={() => navigate(`/app/${selectedItem.type}/${selectedItem.schemaId}`)}
                            />
                        )}
                    </>
                ) : (
                    <DetailView
                        item={selectedItem}
                        schemas={[...entities, ...queries, ...pages]}
                        onEdit={(tab) => {
                            navigate(`/app/${selectedItem?.type}/${selectedItem?.schemaId}/edit${tab ? `?tab=${tab}` : ''}`);
                        }}
                        onDelete={handleDelete}
                        onSelect={handleSelectItem}
                    />
                )}



                {showChat && (
                    <ChatPanel
                        messages={localMessages}
                        isLoading={chatLoading}
                        isReachingEnd={!!isReachingEnd}
                        isFetchingMore={!!isFetchingMore}
                        onLoadMore={async () => { await setSize(size + 1); }}
                        onSend={handleSend}
                    />
                )}
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

