import { Layers } from 'lucide-react';
import type { PageMetadata } from '@cms/shared';

interface PageComponentsSectionProps {
    metadata: PageMetadata;
    selectedComponentId: string | null;
    onSelectComponent: (id: string | null) => void;
    onRemoveComponent?: (id: string) => void;
    onModifyComponent?: (id: string, req: string) => void;
}

export function PageComponentsSection({ metadata, selectedComponentId, onSelectComponent }: PageComponentsSectionProps) {
    const components = metadata.components;

    if (!components || Object.keys(components).length === 0) return null;

    const componentIds = Object.keys(components);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Components
                </h3>
                <span className="text-[10px] font-bold text-primary-muted">{componentIds.length} component{componentIds.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    {componentIds.map(id => {
                        const isSelected = selectedComponentId === id;

                        return (
                            <div key={id} className="relative flex items-center group">
                                <button
                                    onClick={() => onSelectComponent(isSelected ? null : id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${isSelected
                                        ? 'bg-orange-50 border-orange-400 text-orange-700 ring-2 ring-orange-200'
                                        : 'bg-app-muted border-border text-primary-muted hover:border-blue-400 hover:text-blue-600'
                                        }`}
                                >
                                    <span className="text-sm">🧩</span>
                                    {id}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
