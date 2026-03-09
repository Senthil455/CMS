import { useState, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Save, Loader2, Maximize2, Minimize2, Plus, Trash2, Layers } from 'lucide-react';
import { type SchemaDto, type ParsedPageDto, type LayoutSection, type LayoutColumn, type PageArchitecture } from '@cms/shared';
import { PagePreviewSection } from './PagePreviewSection';

import { useRef } from 'react';

// -- Subcomponents --

function ColumnResizer({ onResize }: { onResize: (delta: number) => void }) {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const accumulatedDelta = useRef(0);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        startX.current = e.clientX;
        accumulatedDelta.current = 0;

        const handlePointerMove = (ev: PointerEvent) => {
            if (!isDragging.current) return;
            const deltaX = ev.clientX - startX.current;

            // Assume 1 span ~ 50px of drag
            const threshold = 50;
            const spansToMove = Math.trunc((deltaX + accumulatedDelta.current) / threshold);

            if (spansToMove !== 0) {
                onResize(spansToMove);
                // Adjust accumulated to carry over remainder
                accumulatedDelta.current = (deltaX + accumulatedDelta.current) - (spansToMove * threshold);
                startX.current = ev.clientX; // reset 
            }
        };

        const handlePointerUp = () => {
            isDragging.current = false;
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.body.style.cursor = '';
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 hover:bg-blue-400 rounded-full cursor-col-resize z-20 flex items-center justify-center border-2 border-white shadow-sm transition-colors"
        >
            <div className="flex gap-px">
                <div className="w-px h-3 bg-white/60" />
                <div className="w-px h-3 bg-white/60" />
            </div>
        </div>
    );
}



function SortableBlockItem({ blockId, componentTypeId, sectionIdx, colIdx, blockIndex, isSelected, onSelect, onRemove }: { blockId: string; componentTypeId?: string; sectionIdx: number; colIdx: number; blockIndex: number; isSelected?: boolean; onSelect?: () => void; onRemove?: () => void; onModify?: (id: string, req: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: blockId,
        data: { sectionIdx, colIdx, blockIndex, isToolbox: false }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const blockLabel = blockId;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
            }}
            className={`flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-sm group transition-colors ${isDragging ? 'border-blue-500 ring-2 ring-blue-200 z-50' : isSelected ? 'border-blue-500 ring-2 ring-blue-500 relative z-20' : 'border-border hover:border-blue-400 relative z-10'}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-grab">
                    <span className="text-base">🧩</span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700 truncate">{blockLabel}</span>
                        {componentTypeId && (
                            <span className="text-[9px] font-bold text-blue-600/60 bg-blue-50 px-1 rounded border border-blue-100 uppercase tracking-tighter w-fit">
                                {componentTypeId}
                            </span>
                        )}
                    </div>
                </div>
                {onRemove && (
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded cursor-pointer"
                        title="Delete Component"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="text-[9px] text-gray-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap opacity-50">ID: {blockId}</div>
        </div>
    );
}

function ColumnZone({ sectionIdx, colIdx, col, isLast, components, selectedBlockId, onSelectBlock, onRemoveBlock, onModifyBlock, onResize }: { sectionIdx: number, colIdx: number, col: LayoutColumn, isLast: boolean, components: any[], selectedBlockId: string | null, onSelectBlock: (id: string) => void, onRemoveBlock: (s: number, c: number, id: string) => void, onModifyBlock?: (id: string, req: string) => void, onResize?: (delta: number) => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${sectionIdx}-${colIdx}`,
        data: { sectionIdx, colIdx, isColumn: true }
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-gray-50 border-2 rounded-lg p-3 min-h-[120px] flex flex-col gap-2 transition-colors relative ${isOver ? 'border-dashed border-blue-400 bg-blue-50/50' : 'border-dashed border-gray-300'}`}
            style={{ gridColumn: `span ${col.span} / span ${col.span}` }}
        >
            {!isLast && onResize && (
                <ColumnResizer onResize={onResize} />
            )}

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1">Col span-{col.span}</div>

            <SortableContext items={col.ids} strategy={verticalListSortingStrategy}>
                {col.ids.map((blockId, bIdx) => (
                    <SortableBlockItem
                        key={blockId}
                        blockId={blockId}
                        componentTypeId={components.find(c => c.id === blockId)?.componentTypeId}
                        blockIndex={bIdx}
                        sectionIdx={sectionIdx}
                        colIdx={colIdx}
                        isSelected={selectedBlockId === blockId}
                        onSelect={() => onSelectBlock(blockId)}
                        onRemove={() => onRemoveBlock(sectionIdx, colIdx, blockId)}
                        onModify={onModifyBlock}
                    />
                ))}
            </SortableContext>

            {col.ids.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-transparent text-gray-400 text-xs italic pointer-events-none">
                    Drop blocks here
                </div>
            )}
        </div>
    );
}

// SECTION_PRESETS kept for adding new layout sections

const SECTION_PRESETS = [
    { id: '12', label: 'Full Width (12)', columns: [12] },
    { id: '1-11', label: 'Nav + Content (1-11)', columns: [1, 11] },
    { id: '6-6', label: 'Half & Half (6-6)', columns: [6, 6] },
    { id: '8-4', label: 'Content + Sidebar (8-4)', columns: [8, 4] },
    { id: '4-8', label: 'Side + Main (4-8)', columns: [4, 8] },
    { id: '4-4-4', label: 'Three Columns (4-4-4)', columns: [4, 4, 4] },
    { id: '3-3-3-3', label: 'Four Columns (3-3-3-3)', columns: [3, 3, 3, 3] },
];

interface PageEditLayoutProps {
    item: SchemaDto;
    pageForm: ParsedPageDto;
    onUpdateField: (field: keyof ParsedPageDto, value: any) => void;
    onSave: (exitAfterSave: boolean) => void;
    onCancel: () => void;
    onSendMessage?: (msg: string) => void;
    isSaving: boolean;
}

import { useSearchParams } from 'react-router-dom';

export function PageEditLayout({
    item,
    pageForm,
    onUpdateField,
    onSave,
    onCancel,
    onSendMessage,
    isSaving
}: PageEditLayoutProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(searchParams.get('block'));

    // Component Library Logic
    const architecture: PageArchitecture = useMemo(() => {
        if (pageForm.metadata?.architecture) {
            return pageForm.metadata.architecture;
        }
        return { pageTitle: '', sections: [], selectedQueries: [], architectureHints: '' };
    }, [pageForm.metadata?.architecture]);

    const placedIds = useMemo(() => {
        const ids = new Set<string>();
        architecture.sections.forEach(s => {
            s.columns.forEach(c => {
                c.ids.forEach(id => ids.add(id));
            });
        });
        return ids;
    }, [architecture]);

    const unplacedComponents = useMemo(() => {
        return (pageForm.metadata?.components || []).filter(c => !placedIds.has(c.id));
    }, [pageForm.metadata?.components, placedIds]);

    // Update URL when block selection changes so it persists or can be cleared
    const handleSelectBlockId = (id: string | null) => {
        setSelectedBlockId(id);
        if (id) {
            searchParams.set('block', id);
        } else {
            searchParams.delete('block');
        }
        setSearchParams(searchParams, { replace: true });
    };

    const selectedHtml = useMemo(() => {
        if (!selectedBlockId) return '';
        return pageForm.metadata?.components?.find(c => c.id === selectedBlockId)?.html || '';
    }, [pageForm.metadata?.components, selectedBlockId]);

    const handleHtmlChange = (newHtml: string) => {
        if (!selectedBlockId) return;
        const metadata = { ...(pageForm.metadata || {}) };
        const components = metadata.components ? [...metadata.components] : [];
        const index = components.findIndex(c => c.id === selectedBlockId);
        if (index > -1) {
            components[index] = { ...components[index], html: newHtml };
        } else {
            components.push({ id: selectedBlockId, html: newHtml });
        }
        metadata.components = components;
        onUpdateField('metadata', metadata);
    };


    const updateArchitecture = useCallback((newSections: LayoutSection[]) => {
        const metadata = { ...(pageForm.metadata || {}) };
        metadata.architecture = {
            ...(metadata.architecture || { pageTitle: '', sections: [], selectedQueries: [], architectureHints: '' }),
            sections: newSections
        };
        onUpdateField('metadata', metadata);
    }, [onUpdateField, pageForm.metadata]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Actions ---

    const addSection = (presetId: string) => {
        const preset = SECTION_PRESETS.find(p => p.id === presetId)!;
        const newSection: LayoutSection = {
            columns: preset.columns.map(span => ({ span, ids: [] }))
        };
        updateArchitecture([...architecture.sections, newSection]);
    };

    const removeSection = (index: number) => {
        const newSections = [...architecture.sections];
        newSections.splice(index, 1);
        updateArchitecture(newSections);
    };

    const removeBlock = (sectionIdx: number, colIdx: number, blockId: string) => {
        const newSections = [...architecture.sections];
        newSections[sectionIdx].columns[colIdx].ids = newSections[sectionIdx].columns[colIdx].ids.filter(id => id !== blockId);
        updateArchitecture(newSections);
    };

    const resizeColumn = (sectionIdx: number, colIdx: number, deltaSpan: number) => {
        const newSections = [...architecture.sections];
        const section = newSections[sectionIdx];

        const leftCol = section.columns[colIdx];
        const rightCol = section.columns[colIdx + 1];

        if (!leftCol || !rightCol) return;

        const newLeftSpan = leftCol.span + deltaSpan;
        const newRightSpan = rightCol.span - deltaSpan;

        if (newLeftSpan >= 1 && newRightSpan >= 1) {
            const newCols = [...section.columns];
            newCols[colIdx] = { ...leftCol, span: newLeftSpan };
            newCols[colIdx + 1] = { ...rightCol, span: newRightSpan };
            newSections[sectionIdx] = { ...section, columns: newCols };
            updateArchitecture(newSections);
        }
    };


    const handleModifyBlock = useCallback((blockId: string, requirement: string) => {
        if (!onSendMessage || !item.id) return;
        // The id is e.g. "page_123" but backend expects the raw schemaId
        const schemaId = item.id;
        onSendMessage(`@modify-component ${schemaId} ${blockId} ${requirement}`);
    }, [onSendMessage, item.id]);

    // --- DnD Helpers ---

    type LocationInfo = { sIdx: number; cIdx: number; bIdx?: number } | null;

    const findLocation = (id: string, activeData: any): LocationInfo => {
        if (id === 'toolbox') {
            return { sIdx: -1, cIdx: -1 };
        }
        if (id.startsWith('column-')) {
            const parts = id.split('-');
            return { sIdx: parseInt(parts[1], 10), cIdx: parseInt(parts[2], 10) };
        }
        if (activeData && activeData.sectionIdx !== undefined) {
            return { sIdx: activeData.sectionIdx, cIdx: activeData.colIdx, bIdx: activeData.blockIndex };
        }
        for (let sIdx = 0; sIdx < architecture.sections.length; sIdx++) {
            const section = architecture.sections[sIdx];
            for (let cIdx = 0; cIdx < section.columns.length; cIdx++) {
                const col = section.columns[cIdx];
                const bIdx = col.ids.findIndex(targetId => targetId === id);
                if (bIdx > -1) {
                    return { sIdx, cIdx, bIdx };
                }
            }
        }
        // Check if it's in unplaced (toolbox)
        if (unplacedComponents.some(c => c.id === id)) {
            return { sIdx: -1, cIdx: -1 };
        }
        return null;
    };

    // --- DnD Handlers ---

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(String(active.id));
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);


        const activeLoc = findLocation(activeIdStr, active.data.current);
        const overLoc = findLocation(overIdStr, over.data.current);

        if (!activeLoc || !overLoc) return;

        // Moving to same col but potentially different index
        if (activeLoc.sIdx === overLoc.sIdx && activeLoc.cIdx === overLoc.cIdx) {
            return;
        }

        const newSections = [...architecture.sections];

        // Source column remove
        if (activeLoc.sIdx !== -1) {
            const sourceCol = newSections[activeLoc.sIdx].columns[activeLoc.cIdx];
            sourceCol.ids = sourceCol.ids.filter(id => id !== activeIdStr);
        }

        // Dest column insert
        if (overLoc.sIdx !== -1) {
            const destCol = newSections[overLoc.sIdx].columns[overLoc.cIdx];
            let targetIndex = destCol.ids.length;
            if (overLoc.bIdx !== undefined) {
                targetIndex = overLoc.bIdx;
            }
            destCol.ids.splice(targetIndex, 0, activeIdStr);
            if (active.data.current) {
                active.data.current.sectionIdx = overLoc.sIdx;
                active.data.current.colIdx = overLoc.cIdx;
                active.data.current.blockIndex = targetIndex;
            }
        }

        updateArchitecture(newSections);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);



        const activeLoc = findLocation(activeIdStr, active.data.current);
        const overLoc = findLocation(overIdStr, over.data.current);

        if (activeLoc && overLoc && activeLoc.sIdx !== -1 && activeLoc.sIdx === overLoc.sIdx && activeLoc.cIdx === overLoc.cIdx) {
            const newSections = [...architecture.sections];
            const col = newSections[activeLoc.sIdx].columns[activeLoc.cIdx];
            col.ids = arrayMove(col.ids, activeLoc.bIdx!, overLoc.bIdx!);
            updateArchitecture(newSections);
        }
    };

    return (
        <section className={`${isFullScreen ? 'fixed inset-0 z-50 bg-app p-4' : 'flex-1'} flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {/* Top bar: Title + Save/Exit actions */}
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3 shrink-0">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest">
                    Visual Layout Editor
                </h3>
                <div className="flex items-center gap-2">
                    {isFullScreen && (
                        <>
                            <button onClick={() => onSave(false)} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-app-muted hover:bg-border rounded-lg text-[10px] font-bold transition-all disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                            </button>
                            <button onClick={() => onSave(true)} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[10px] font-bold transition-all shadow-sm disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-white/80" />}
                                Save & Exit
                            </button>
                            <div className="w-px h-5 bg-border mx-1" />
                            <button onClick={onCancel} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-app-muted rounded-lg text-[10px] font-bold transition-all text-primary-muted hover:text-primary disabled:opacity-50">
                                <X className="w-3 h-3" /> Exit
                            </button>
                        </>
                    )}
                    <div className="w-px h-4 bg-border mx-1" />
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 hover:bg-app-muted rounded-md text-primary-muted hover:text-primary transition-colors">
                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Main 4:8 Content Area */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex flex-row gap-3 min-h-0">

                    {/* LEFT: Layout Canvas (4 parts) */}
                    <div className="flex flex-col min-h-0" style={{ flexBasis: '33.333%', flexShrink: 0 }}>
                        {/* Canvas Header Bar 1: Components */}
                        <div className="shrink-0 border border-border rounded-xl bg-app mb-2 shadow-sm">
                            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-primary-muted uppercase tracking-widest flex items-center gap-1.5">
                                    <Layers className="w-3 h-3" />
                                    Unplaced
                                </h4>
                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{unplacedComponents.length}</span>
                            </div>
                            <div className="p-2">
                                {unplacedComponents.length === 0 ? (
                                    <p className="text-[10px] text-gray-400 italic text-center py-1">All placed ✓</p>
                                ) : (
                                    <SortableContext items={unplacedComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-wrap gap-1.5">
                                            {unplacedComponents.map(com => (
                                                <SortableBlockItem
                                                    key={com.id}
                                                    blockId={com.id}
                                                    componentTypeId={com.componentTypeId}
                                                    blockIndex={-1}
                                                    sectionIdx={-1}
                                                    colIdx={-1}
                                                    isSelected={selectedBlockId === com.id}
                                                    onSelect={() => handleSelectBlockId(com.id)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                )}
                            </div>
                        </div>

                        {/* Canvas Header Bar 2: Section Presets */}
                        <div className="shrink-0 border border-border rounded-xl bg-app mb-2 shadow-sm">
                            <div className="px-3 py-2 border-b border-border">
                                <h4 className="text-[10px] font-bold text-primary-muted uppercase tracking-widest">Add Section</h4>
                            </div>
                            <div className="p-2 flex flex-wrap gap-1.5">
                                {SECTION_PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => addSection(preset.id)}
                                        className="px-2 py-1 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 rounded text-[10px] font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        + {preset.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Canvas Body: Sections & Columns */}
                        <div className="flex-1 border border-border rounded-xl bg-gray-50 flex flex-col overflow-hidden shadow-sm relative min-h-0">
                            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                            <div className="flex-1 overflow-y-auto p-4 z-10 space-y-4">
                                {architecture.sections.length === 0 ? (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-center py-12">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-3">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-500">Add a section above</p>
                                        <p className="text-[10px] text-gray-400 mt-1">Then drag components into the grid</p>
                                    </div>
                                ) : (
                                    architecture.sections.map((section, sIdx) => (
                                        <div key={sIdx} className="bg-white border border-border shadow-sm rounded-xl p-3 relative group">
                                            <button onClick={() => removeSection(sIdx)} className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-20">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <div className="grid gap-3 w-full" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
                                                {section.columns.map((col, cIdx) => (
                                                    <ColumnZone
                                                        key={cIdx}
                                                        sectionIdx={sIdx}
                                                        colIdx={cIdx}
                                                        col={col}
                                                        isLast={cIdx === section.columns.length - 1}
                                                        components={pageForm.metadata?.components || []}
                                                        selectedBlockId={selectedBlockId}
                                                        onSelectBlock={handleSelectBlockId}
                                                        onRemoveBlock={removeBlock}
                                                        onModifyBlock={onSendMessage ? handleModifyBlock : undefined}
                                                        onResize={(delta) => resizeColumn(sIdx, cIdx, delta)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Preview + HTML Source (8 parts) */}
                    <div className="flex flex-col gap-3 min-h-0 min-w-0" style={{ flexBasis: '66.666%', flexGrow: 1 }}>
                        {/* Top: HTML Preview */}
                        <div className={`border border-border rounded-xl bg-gray-50 flex flex-col overflow-hidden shadow-sm relative ${selectedBlockId ? 'flex-1' : 'flex-1'}`}>
                            <PagePreviewSection
                                schema={item}
                                html={pageForm.html}
                                hideHeader={false}
                                highlightComponentId={selectedBlockId}
                            />
                        </div>

                        {/* Bottom: HTML Source (only when component is selected) */}
                        {selectedBlockId && (
                            <div className="h-72 shrink-0 border border-border rounded-xl bg-gray-50 flex flex-col overflow-hidden shadow-sm">
                                <div className="px-3 py-2 border-b border-border bg-white flex items-center justify-between z-10 shrink-0">
                                    <h4 className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        HTML Source — {selectedBlockId}
                                    </h4>
                                    <button onClick={() => handleSelectBlockId(null)} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                                    <Editor
                                        height="100%"
                                        defaultLanguage="html"
                                        value={selectedHtml}
                                        onChange={(value) => handleHtmlChange(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 12,
                                            padding: { top: 10, bottom: 10 },
                                            scrollBeyondLastLine: false,
                                            wordWrap: 'on',
                                            automaticLayout: true,
                                            tabSize: 2,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                    {activeId ? (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl font-bold text-sm tracking-wide border-2 border-blue-400 rotate-2 cursor-grabbing flex items-center gap-2 min-w-[120px]">
                            <span>🧩</span> Moving…
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </section>
    );
}

