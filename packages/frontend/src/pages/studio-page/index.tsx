import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { useSchemas } from '../../hooks/use-schemas';
import { type ChatMessage, type SchemaSummary, type SchemaDto, type SaveSchemaPayload } from '@cms/shared';
import { StudioHeader } from './StudioHeader';
import { Explorer } from './explorer-panel/Explorer';
import { DetailView } from './detail-panel/DetailView';
import { EntityEdit } from './detail-panel/entity/EntityEdit';
import { QueryEdit } from './detail-panel/query/QueryEdit';
import { PageEdit } from './detail-panel/page/PageEdit';
import { ChatPanel } from './chat-panel/ChatPanel';
import { SchemaConfirmationModal } from './chat-panel/entity-confirm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

export default function StudioPage() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const { entities, queries, pages, saveSchema, mutate } = useSchemas();
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { user, logout } = useAuth();
    const { history, isLoading: chatLoading, size, setSize, isReachingEnd, isFetchingMore } = useChatHistory();
    const { sendMessage, sendSchemaResponse, onMessageReceived, onSchemaSummaryToConfirm, onSchemasSync } = useSocket();
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
        await saveSchema(payload);
        navigate(`/app/${payload.type}/${payload.schemaId || id}`);
    };

    const { deleteSchema } = useSchemas();

    // Delete Logic
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!selectedItem) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;

        try {
            setIsDeleting(true);
            await deleteSchema(selectedItem.id);
            setShowDeleteConfirm(false);
            navigate('/app');
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete item');
        } finally {
            setIsDeleting(false);
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
        const unsubReceived = onMessageReceived((msg: ChatMessage) => {
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

        const unsubSync = onSchemasSync((data) => {
            console.log('Schema sync received:', data);
            if (data.task_type === 'query_generator' || data.task_type === 'entity_generator') {
                mutate();
            }
        });

        return () => {
            unsubReceived();
            unsubConfirm();
            unsubSync();
        };
    }, [onMessageReceived, onSchemaSummaryToConfirm, onSchemasSync, mutate]);

    const handleSend = (content: string, agentName: string) => {
        sendMessage(content, agentName);
    };

    const handleConfirmSchema = (response: SchemaSummary) => {
        sendSchemaResponse(response);
        setShowConfirmation(false);
        setConfirmationData(null);
    };

    const [chatDraft, setChatDraft] = useState<string | null>(null);

    const handleChatAction = (action: string) => {
        setChatDraft(action);
        setShowChat(true);
    }

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
                        onChatAction={handleChatAction}
                    />
                )}

                {isEditing && selectedItem ? (
                    <>
                        {selectedItem.type === 'entity' && (
                            <EntityEdit
                                item={selectedItem}
                                initialTab={editTab === 'settings' ? 'settings' : 'attributes'}
                                onTabChange={(tab) => setSearchParams({ tab: tab === 'attributes' ? 'code' : 'settings' })}
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
                        chatDraft={chatDraft}
                    />
                )}
            </div>

            <SchemaConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmSchema}
                schemaSummary={confirmationData || { userInput: '', summary: '', entities: [], relationships: [] }}
            />

            <DeleteConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                item={selectedItem}
                isDeleting={isDeleting}
            />
        </div>
    );
}
