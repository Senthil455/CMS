import { Info, FileText, Globe } from 'lucide-react';
import { type ParsedPageDto } from '@cms/shared';
import { FormField } from './FormField';

interface PageEditSettingsProps {
    pageForm: ParsedPageDto;
    onUpdateField: (field: keyof ParsedPageDto, value: any) => void;
}

export function PageEditSettings({ pageForm, onUpdateField }: PageEditSettingsProps) {
    return (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                General Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Page Name">
                    <div className="relative">
                        <FileText className="absolute left-3 top-2.5 w-4 h-4 text-primary-muted" />
                        <input
                            type="text"
                            value={pageForm.name}
                            onChange={(e) => onUpdateField('name', e.target.value)}
                            className="app-input pl-9"
                            placeholder="e.g. landing-page"
                        />
                    </div>
                </FormField>
                <FormField label="Page Title">
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-primary-muted" />
                        <input
                            type="text"
                            value={pageForm.title}
                            onChange={(e) => onUpdateField('title', e.target.value)}
                            className="app-input pl-9"
                            placeholder="e.g. Landing Page"
                        />
                    </div>
                </FormField>
            </div>
        </section>
    );
}
