import type { RelationshipDto } from '@cms/shared';

type SchemaRelationship = RelationshipDto;

interface RelationshipCardProps {
    rel: SchemaRelationship;
    index: number;
    isSkipped: boolean;
    onToggleSkip: (index: number) => void;
}

export function RelationshipCard({ rel, index, isSkipped, onToggleSkip }: RelationshipCardProps) {
    return (
        <div
            className={`p-4 rounded-xl border transition-all duration-200 ${isSkipped
                ? 'bg-app-muted/20 border-border opacity-60'
                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{rel.sourceEntity}</span>
                        <span className="text-xs text-primary-muted opacity-50">→</span>
                        <span className="text-sm font-bold text-primary">{rel.targetEntity}</span>
                    </div>
                    <span className="text-[10px] text-primary-muted font-mono mt-1">Field: {rel.fieldName}</span>
                </div>
                <button
                    onClick={() => onToggleSkip(index)}
                    className={`text-[10px] px-2 py-1 rounded-md font-semibold transition-colors ${isSkipped
                        ? 'bg-primary text-app hover:opacity-90'
                        : 'bg-app-muted text-primary-muted hover:bg-app-surface border border-border'
                        }`}
                >
                    {isSkipped ? 'Include' : 'Skip'}
                </button>
            </div>
            {!isSkipped && (
                <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex flex-col">
                        <span className="text-primary-muted uppercase font-bold opacity-50">Cardinality</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{rel.cardinality}</span>
                    </div>
                    {rel.label && (
                        <div className="flex flex-col">
                            <span className="text-primary-muted uppercase font-bold opacity-50">Label</span>
                            <span className="font-medium">{rel.label || rel.fieldName}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
