import { ChevronRight, ChevronDown, Plus, type LucideIcon } from 'lucide-react';
import { type SchemaDto } from '@cms/shared';

interface ExplorerGroupProps {
    label: string;
    groupIcon: LucideIcon;
    itemIcon: LucideIcon;
    items: SchemaDto[];
    isExpanded: boolean;
    onToggle: () => void;
    onAdd: (e: React.MouseEvent) => void;
    onSelect: (item: SchemaDto) => void;
    selectedItem: SchemaDto | null;
    isLoading: boolean;
    emptyText: string;
}

export function ExplorerGroup({
    label,
    groupIcon: GroupIcon,
    itemIcon: ItemIcon,
    items,
    isExpanded,
    onToggle,
    onAdd,
    onSelect,
    selectedItem,
    isLoading,
    emptyText
}: ExplorerGroupProps) {
    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-1 px-2 py-1 hover:bg-app-muted rounded-lg text-sm font-semibold text-primary/80 group"
            >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <GroupIcon className="w-4 h-4" />
                <span>{label}</span>

                <div className="ml-auto flex items-center gap-1">
                    <div
                        role="button"
                        onClick={onAdd}
                        className="p-1 rounded bg-primary/5 hover:bg-primary/20 text-primary transition-colors"
                        title={`Create ${label}`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] bg-app-muted px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
            </button>
            {isExpanded && (
                <div className="mt-1 flex flex-col gap-0.5 ml-4">
                    {items.map(item => {
                        const isSelected = selectedItem?.schemaId === item.schemaId;
                        return (
                            <div
                                key={item.schemaId}
                                onClick={() => onSelect(item)}
                                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors rounded-lg overflow-hidden whitespace-nowrap overflow-ellipsis ${isSelected
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-app-muted text-primary-muted hover:text-primary'
                                    }`}
                                title={item.name}
                            >
                                <ItemIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </div>
                        );
                    })}
                    {items.length === 0 && !isLoading && <div className="text-[10px] text-primary-muted px-3 py-1 italic">{emptyText}</div>}
                </div>
            )}
        </div>
    );
}
