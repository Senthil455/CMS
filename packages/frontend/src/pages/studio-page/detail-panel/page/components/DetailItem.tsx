import { type ReactNode } from 'react';

interface DetailItemProps {
    label: string;
    value: string;
    href?: string;
    icon?: ReactNode;
    isLink?: boolean;
}

export function DetailItem({ label, value, href, icon, isLink }: DetailItemProps) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary-muted uppercase tracking-wider flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <div className="text-sm font-medium text-primary px-3 py-2 bg-app-surface border border-border rounded-lg shadow-sm group relative">
                {isLink && value ? (
                    <a
                        href={href || value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 hover:underline break-all"
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
