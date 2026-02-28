import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory } from '../../hooks/use-chat-history';
import { useSocket } from '../../hooks/use-socket';
import { useSchemas } from '../../hooks/use-schemas';
import { useSocketContext } from '../../context/socket-provider';
import { Loader2 } from 'lucide-react';
import { type ChatMessage, type SchemaSummary, type SchemaDto, type SaveSchemaPayload, type TemplateSelectionRequest, type SystemPlanConfirmationDto } from '@cms/shared';
import { StudioHeader } from './StudioHeader';
import { Explorer } from './explorer-panel/Explorer';
import { DetailView } from './detail-panel/DetailView';
import { EntityEdit } from './detail-panel/entity/EntityEdit';
import { QueryEdit } from './detail-panel/query/QueryEdit';
import { PageEdit } from './detail-panel/page/PageEdit';
import { ChatPanel } from './chat-panel/ChatPanel';
import { SchemaConfirmationModal } from './chat-panel/entity-confirm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { TemplateSelectionDialog } from './TemplateSelectionDialog';
import { SystemPlanConfirmationModal } from './SystemPlanConfirmationModal';

export default function StudioPage() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { hasConnectedOnce, isConnected, connectError } = useSocketContext();

    const { entities, queries, pages, saveSchema, mutate } = useSchemas();
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const { user, logout } = useAuth();
    const { history, isLoading: chatLoading, size, setSize, isReachingEnd, isFetchingMore } = useChatHistory();
    const { sendMessage, sendSchemaResponse, sendTemplateSelectionResponse, sendSystemPlanResponse, onMessageReceived, onSchemaSummaryToConfirm, onTemplateSelectionListToConfirm, onTemplateSelectionDetailToConfirm, onSystemPlanToConfirm, onSchemasSync } = useSocket();
    const [isDark, setIsDark] = useState(false);
    const [showExplorer, setShowExplorer] = useState(true);
    const [showChat, setShowChat] = useState(true);

    const isEditing = location.pathname.endsWith('/edit');
    const editTab = searchParams.get('tab') || 'settings';

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

    const handleSaveEntity = async (payload: SaveSchemaPayload, skipNavigate?: boolean) => {
        await saveSchema(payload);
        if (!skipNavigate) {
            navigate(`/app/${payload.type}/${payload.schemaId || id}`);
        }
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

    // Template Selection State
    const [showTemplateSelection, setShowTemplateSelection] = useState(false);
    const [templateSelectionData, setTemplateSelectionData] = useState<TemplateSelectionRequest | null>(null);

    // System Plan Confirmation State
    const [showSystemPlanConfirmation, setShowSystemPlanConfirmation] = useState(false);
    const [systemPlanData, setSystemPlanData] = useState<SystemPlanConfirmationDto | null>(null);

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
            setShowChat(true); // Auto-open chat on new message
        });

        const unsubConfirm = onSchemaSummaryToConfirm((data) => {
            console.log(data);
            setConfirmationData(data);
            setShowConfirmation(true);
        });

        const unsubTemplateList = onTemplateSelectionListToConfirm((data: TemplateSelectionRequest) => {
            console.log('Template selection (List) requested:', data);
            setTemplateSelectionData(data);
            setShowTemplateSelection(true);
        });

        const unsubTemplateDetail = onTemplateSelectionDetailToConfirm((data: TemplateSelectionRequest) => {
            console.log('Template selection (Detail) requested:', data);
            setTemplateSelectionData(data);
            setShowTemplateSelection(true);
        });

        const unsubSync = onSchemasSync((data) => {
            console.log('Schema sync received:', data);
            mutate();
        });

        const unsubSystemPlan = onSystemPlanToConfirm((data) => {
            console.log('System plan confirmation requested:', data);
            setSystemPlanData(data);
            setShowSystemPlanConfirmation(true);
        });

        return () => {
            unsubReceived();
            unsubConfirm();
            unsubTemplateList();
            unsubTemplateDetail();
            unsubSystemPlan();
            unsubSync();
        };
    }, [onMessageReceived, onSchemaSummaryToConfirm, onTemplateSelectionListToConfirm, onTemplateSelectionDetailToConfirm, onSystemPlanToConfirm, onSchemasSync, mutate]);

    const handleSend = (content: string, providerName: string) => {
        sendMessage(content, providerName);
        setShowChat(true);
    };

    const handleConfirmSchema = (response: SchemaSummary) => {
        sendSchemaResponse(response);
        setShowConfirmation(false);
        setConfirmationData(null);
    };

    const handleConfirmTemplate = (selectedTemplateId: string) => {
        if (templateSelectionData) {
            sendTemplateSelectionResponse({
                selectedTemplate: selectedTemplateId,
                requestPayload: templateSelectionData
            });
            setShowTemplateSelection(false);
            setTemplateSelectionData(null);
        }
    };

    const handleConfirmSystemPlan = (plan: SystemPlanConfirmationDto) => {
        sendSystemPlanResponse(plan);
        setShowSystemPlanConfirmation(false);
        setSystemPlanData(null);
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
        <div className="flex flex-col h-full bg-app transition-colors duration-300 overflow-hidden">
            <StudioHeader
                isDark={isDark}
                toggleTheme={toggleTheme}
                showExplorer={showExplorer}
                onToggleExplorer={() => setShowExplorer(!showExplorer)}
                showChat={showChat}
                onToggleChat={() => setShowChat(!showChat)}
            />

            {!hasConnectedOnce && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-amber-700 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>CMS is starting up… please wait a moment. (v1.1)</span>
                </div>
            )}

            {hasConnectedOnce && !isConnected && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-center gap-2 text-red-700 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>
                        {connectError
                            ? `Connection failed: ${connectError}`
                            : 'Connection lost — reconnecting…'}
                    </span>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {showExplorer && (
                    <Explorer
                        onSelectItem={handleSelectItem}
                        selectedItem={selectedItem}
                        onChatAction={handleChatAction}
                        onClose={() => setShowExplorer(false)}
                        user={user}
                        logout={logout}
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
                                availableEntities={entities}
                            />
                        )}
                        {selectedItem.type === 'query' && (
                            <QueryEdit
                                item={selectedItem}
                                initialTab={editTab as 'settings' | 'code'}
                                onTabChange={(tab) => setSearchParams({ tab })}
                                onSave={handleSaveEntity}
                                onCancel={() => navigate(`/app/${selectedItem.type}/${selectedItem.schemaId}`)}
                            />
                        )}
                        {selectedItem.type === 'page' && (
                            <PageEdit
                                item={selectedItem}
                                initialTab={editTab as 'settings' | 'layout'}
                                onTabChange={(tab) => setSearchParams({ tab })}
                                onSave={handleSaveEntity}
                                onCancel={() => navigate(`/app/${selectedItem.type}/${selectedItem.schemaId}`)}
                                onSendMessage={(msg) => handleSend(msg, localStorage.getItem('cms_ai_provider') || 'openai')}
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
                        onChatAction={handleChatAction}
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
                        onDraftConsumed={() => setChatDraft(null)}
                        onClose={() => setShowChat(false)}
                    />
                )}
            </div>

            <SchemaConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmSchema}
                schemaSummary={confirmationData || { userInput: '', summary: '', entities: [], relationships: [] }}
            />

            <TemplateSelectionDialog
                isOpen={showTemplateSelection}
                onClose={() => setShowTemplateSelection(false)}
                onConfirm={handleConfirmTemplate}
                templates={templateSelectionData?.templates || []}
                pageType={templateSelectionData?.plan?.pageType}
            />

            <SystemPlanConfirmationModal
                isOpen={showSystemPlanConfirmation}
                onClose={() => setShowSystemPlanConfirmation(false)}
                onConfirm={handleConfirmSystemPlan}
                plan={systemPlanData}
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

