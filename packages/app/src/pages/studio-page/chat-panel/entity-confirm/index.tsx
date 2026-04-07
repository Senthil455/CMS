import { useRef, useEffect, useState } from 'react';
import { FileJson } from 'lucide-react';
import type { SchemaSummary } from '@cms/shared';
import { ModalHeader } from './header';
import { ModalFooter } from './footer';
import { EntityCard } from './entity-card';
import { RelationshipCard } from './relationship-card';

interface SchemaConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (response: SchemaSummary) => void;
    schemaSummary: SchemaSummary;
}

export function SchemaConfirmationModal({ isOpen, onClose, onConfirm, schemaSummary }: SchemaConfirmationModalProps) {
    const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set());
    const [skippedRelationshipIndices, setSkippedRelationshipIndices] = useState<Set<number>>(new Set());
    const [entities, setEntities] = useState(schemaSummary.entities);
    const modalRef = useRef<HTMLDivElement>(null);

    // Sync local state when schemaSummary prop changes (e.g. arrives async)
    useEffect(() => {
        setEntities(schemaSummary.entities);
    }, [schemaSummary]);

    const updateEntity = (index: number, updated: typeof entities[number]) => {
        setEntities((prev) => prev.map((e, i) => i === index ? updated : e));
    };

    const toggleSkip = (index: number) => {
        setSkippedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const toggleRelationshipSkip = (index: number) => {
        setSkippedRelationshipIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleConfirm = () => {
        const response: SchemaSummary = {
            userInput: schemaSummary.userInput,
            summary: schemaSummary.summary,
            entities: entities.filter((_, idx) => !skippedIndices.has(idx)),
            relationships: (schemaSummary.relationships || []).filter((_, idx) => !skippedRelationshipIndices.has(idx))
        };
        onConfirm(response);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-app-surface w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200"
            >
                <ModalHeader onClose={onClose} />

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        {entities.map((item, index) => (
                            <EntityCard
                                key={index}
                                item={item}
                                index={index}
                                isSkipped={skippedIndices.has(index)}
                                onToggleSkip={toggleSkip}
                                onUpdate={updateEntity}
                            />
                        ))}
                    </div>

                    {schemaSummary.relationships && schemaSummary.relationships.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <FileJson className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary-muted opacity-80">Proposed Relationships</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {schemaSummary.relationships.map((rel, index) => (
                                    <RelationshipCard
                                        key={index}
                                        rel={rel}
                                        index={index}
                                        isSkipped={skippedRelationshipIndices.has(index)}
                                        onToggleSkip={toggleRelationshipSkip}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <ModalFooter onClose={onClose} onConfirm={handleConfirm} />
            </div>
        </div>
    );
}
