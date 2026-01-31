import { type ReactNode } from 'react';

interface DetailItemProps {
    label: string;
    value: string;
    href?: string;
    icon?: ReactNode;
    isLink?: boolean;
    fullWidth?: boolean;
}

export function DetailItem({ label, value, href, icon, isLink, fullWidth }: DetailItemProps) {
    return (
        <div className={`flex items-center gap-2 ${fullWidth ? '' : ''}`}>
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-1 whitespace-nowrap min-w-[80px]">
                {icon}
                {label}
            </span>
            <div className="text-sm font-medium text-primary px-2 py-1 bg-app-surface border border-border rounded flex-1 truncate">
                {isLink && value ? (
                    <a
                        href={href || value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 hover:underline"
                    >
                        {value}
                    </a>
                ) : (
                    value || <span className="text-primary-muted italic">Not set</span>
                )}
            </div>
        </div>
    );
}

