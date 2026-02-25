import { useState, useCallback, useMemo } from 'react';
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
import { X, Save, Loader2, Maximize2, Minimize2, Plus, Trash2 } from 'lucide-react';
import { type SchemaDto, type ParsedPageDto, type LayoutJson, type LayoutSection, type LayoutColumn, type LayoutBlock } from '@cms/shared';
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



function SortableBlockItem({ block, sectionIdx, colIdx, blockIndex, onRemove, onModify }: { block: LayoutBlock; sectionIdx: number; colIdx: number; blockIndex: number; onRemove: () => void; onModify?: (id: string, req: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: block.type, sectionIdx, colIdx, blockIndex, isToolbox: false }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [requirement, setRequirement] = useState('');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const blockLabel = block.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (requirement.trim() && onModify) {
            onModify(block.id, requirement.trim());
            setIsEditing(false);
            setRequirement('');
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-sm group transition-colors ${isDragging ? 'border-blue-500 ring-2 ring-blue-200 z-50' : 'border-border hover:border-blue-400 relative z-10'}`}
        >
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {onModify && (
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                        className="w-5 h-5 bg-white border border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-500 rounded-full flex items-center justify-center"
                        title="Modify Component with AI"
                    >
                        <span className="text-[10px]">✨</span>
                    </button>
                )}
                <button
                    onPointerDown={(e) => { e.stopPropagation(); onRemove(); }}
                    className="w-5 h-5 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500 rounded-full flex items-center justify-center"
                    title="Remove Component"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>

            <div className="flex items-center gap-2 cursor-grab">
                <span className="text-base">🧩</span>
                <span className="text-xs font-bold text-gray-700 truncate">{blockLabel}</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">ID: {block.id}</div>

            {isEditing && (
                <div
                    className="mt-2 pt-2 border-t border-gray-100"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking input
                >
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={requirement}
                            onChange={(e) => setRequirement(e.target.value)}
                            placeholder="e.g. Make cards have hover effect..."
                            className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!requirement.trim()}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            Ask AI
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

function ColumnZone({ sectionIdx, colIdx, col, isLast, onRemoveBlock, onModifyBlock, onResize }: { sectionIdx: number, colIdx: number, col: LayoutColumn, isLast: boolean, onRemoveBlock: (s: number, c: number, id: string) => void, onModifyBlock?: (id: string, req: string) => void, onResize?: (delta: number) => void }) {
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

            <SortableContext items={col.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {col.blocks.map((block, bIdx) => (
                    <SortableBlockItem
                        key={block.id}
                        block={block}
                        blockIndex={bIdx}
                        sectionIdx={sectionIdx}
                        colIdx={colIdx}
                        onRemove={() => onRemoveBlock(sectionIdx, colIdx, block.id)}
                        onModify={onModifyBlock}
                    />
                ))}
            </SortableContext>

            {col.blocks.length === 0 && (
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

export function PageEditLayout({
    item,
    pageForm,
    onUpdateField,
    onSave,
    onCancel,
    onSendMessage,
    isSaving
}: PageEditLayoutProps) {
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);


    // Initialize layout state safely
    const layout: LayoutJson = useMemo(() => {
        if (pageForm.metadata?.layoutJson?.sections) {
            return pageForm.metadata.layoutJson as LayoutJson;
        }
        return { sections: [] };
    }, [pageForm.metadata?.layoutJson]);

    const updateLayout = useCallback((newLayout: LayoutJson) => {
        const metadata = { ...(pageForm.metadata || {}) };
        metadata.layoutJson = newLayout;
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
            preset: preset.id,
            columns: preset.columns.map(span => ({ span, blocks: [] }))
        };
        updateLayout({ sections: [...layout.sections, newSection] });
    };

    const removeSection = (index: number) => {
        const newSections = [...layout.sections];
        newSections.splice(index, 1);
        updateLayout({ sections: newSections });
    };

    const removeBlock = (sectionIdx: number, colIdx: number, blockId: string) => {
        const newSections = [...layout.sections];
        newSections[sectionIdx].columns[colIdx].blocks = newSections[sectionIdx].columns[colIdx].blocks.filter(b => b.id !== blockId);
        updateLayout({ sections: newSections });
    };

    const resizeColumn = (sectionIdx: number, colIdx: number, deltaSpan: number) => {
        const newSections = [...layout.sections];
        const section = newSections[sectionIdx];

        const leftCol = section.columns[colIdx];
        const rightCol = section.columns[colIdx + 1];

        if (!leftCol || !rightCol) return;

        const newLeftSpan = leftCol.span + deltaSpan;
        const newRightSpan = rightCol.span - deltaSpan;

        if (newLeftSpan >= 1 && newRightSpan >= 1) {
            // Reconstruct array to avoid mutating object reference directly if strict mode is active, though deep copy is better.
            const newCols = [...section.columns];
            newCols[colIdx] = { ...leftCol, span: newLeftSpan };
            newCols[colIdx + 1] = { ...rightCol, span: newRightSpan };
            newSections[sectionIdx] = { ...section, columns: newCols };
            updateLayout({ sections: newSections });
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
        if (id.startsWith('column-')) {
            const parts = id.split('-');
            return { sIdx: parseInt(parts[1], 10), cIdx: parseInt(parts[2], 10) };
        }
        if (activeData && activeData.sectionIdx !== undefined) {
            return { sIdx: activeData.sectionIdx, cIdx: activeData.colIdx, bIdx: activeData.blockIndex };
        }
        for (let sIdx = 0; sIdx < layout.sections.length; sIdx++) {
            const section = layout.sections[sIdx];
            for (let cIdx = 0; cIdx < section.columns.length; cIdx++) {
                const col = section.columns[cIdx];
                const bIdx = col.blocks.findIndex(b => b.id === id);
                if (bIdx > -1) {
                    return { sIdx, cIdx, bIdx };
                }
            }
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

        if (activeLoc.sIdx === overLoc.sIdx && activeLoc.cIdx === overLoc.cIdx) {
            return;
        }

        const newSections = [...layout.sections];
        const sourceCol = newSections[activeLoc.sIdx].columns[activeLoc.cIdx];
        const destCol = newSections[overLoc.sIdx].columns[overLoc.cIdx];

        const blockToMove = sourceCol.blocks[activeLoc.bIdx!];

        sourceCol.blocks = sourceCol.blocks.filter(b => b.id !== activeIdStr);

        let targetIndex = destCol.blocks.length;
        if (overLoc.bIdx !== undefined) {
            targetIndex = overLoc.bIdx;
        }

        destCol.blocks.splice(targetIndex, 0, blockToMove);
        updateLayout({ sections: newSections });

        if (active.data.current) {
            active.data.current.sectionIdx = overLoc.sIdx;
            active.data.current.colIdx = overLoc.cIdx;
            active.data.current.blockIndex = targetIndex;
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);



        const activeLoc = findLocation(activeIdStr, active.data.current);
        const overLoc = findLocation(overIdStr, over.data.current);

        if (activeLoc && overLoc && activeLoc.sIdx === overLoc.sIdx && activeLoc.cIdx === overLoc.cIdx) {
            const newSections = [...layout.sections];
            const col = newSections[activeLoc.sIdx].columns[activeLoc.cIdx];
            col.blocks = arrayMove(col.blocks, activeLoc.bIdx!, overLoc.bIdx!);
            updateLayout({ sections: newSections });
        }
    };

    return (
        <section className={`${isFullScreen ? 'fixed inset-0 z-50 bg-app p-4' : 'flex-1'} flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                        Visual Layout Editor (Beta)
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {isFullScreen && (
                        <>
                            <button onClick={() => onSave(false)} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 bg-app-muted hover:bg-border rounded-lg text-[10px] font-bold transition-all disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                            </button>
                            <button onClick={() => onSave(true)} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[10px] font-bold transition-all shadow-sm disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-white/80" />}
                                Save & Exit
                            </button>
                            <div className="w-px h-5 bg-border mx-1" />
                            <button onClick={onCancel} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-muted rounded-lg text-[10px] font-bold transition-all text-primary-muted hover:text-primary disabled:opacity-50">
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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex flex-row gap-4 h-full min-h-0">



                    {/* CANVAS PANE */}
                    <div className="flex-1 border border-border rounded-xl bg-gray-50 flex flex-col h-full overflow-hidden shadow-sm relative">
                        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                        <div className="p-4 border-b border-border bg-white z-10 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-primary-muted uppercase tracking-wider">Layout Canvas</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium mr-2">Add Section:</span>
                                {SECTION_PRESETS.map(preset => (
                                    <button key={preset.id} onClick={() => addSection(preset.id)} className="px-2 py-1 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 rounded text-[10px] font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                        + {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 z-10 space-y-6">
                            {layout.sections.length === 0 ? (
                                <div className="h-full w-full flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Empty Layout</h3>
                                    <p className="text-sm text-gray-500 max-w-sm">Design your page by adding a layout section from the top toolbar, then drag components into the columns.</p>
                                </div>
                            ) : (
                                layout.sections.map((section, sIdx) => (
                                    <div key={sIdx} className="bg-white border border-border shadow-sm rounded-xl p-4 relative group">
                                        <button onClick={() => removeSection(sIdx)} className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid gap-4 w-full" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
                                            {section.columns.map((col, cIdx) => (
                                                <ColumnZone
                                                    key={cIdx}
                                                    sectionIdx={sIdx}
                                                    colIdx={cIdx}
                                                    col={col}
                                                    isLast={cIdx === section.columns.length - 1}
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

                    {/* PREVIEW PANE */}
                    <div className="flex-1 border border-border rounded-xl bg-gray-50 flex flex-col h-full overflow-hidden shadow-sm relative">
                        <PagePreviewSection
                            schema={item}
                            html={pageForm.html}
                            hideHeader={false}
                        />
                    </div>
                </div>

                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                    {activeId ? (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl font-bold text-sm tracking-wide border-2 border-blue-400 rotate-3 cursor-grabbing flex items-center justify-center min-w-[150px]">
                            Moving Block...
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </section>
    );
}
