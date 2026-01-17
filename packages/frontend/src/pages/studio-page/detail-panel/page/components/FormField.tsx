import { type ReactNode } from 'react';

interface FormFieldProps {
    label: string;
    children: ReactNode;
    small?: boolean;
}

export function FormField({ label, children, small = false }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className={`font-bold text-primary-muted uppercase tracking-tight ${small ? 'text-[10px]' : 'text-xs'}`}>
                {label}
            </label>
            {children}
        </div>
    );
}
