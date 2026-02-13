
import { type QueryDto } from '@cms/shared';
import { Database } from 'lucide-react';

interface QueryEditSettingProps {
    queryForm: QueryDto;
    updateField: (field: keyof QueryDto, value: any) => void;
}

export function QueryEditSetting({ queryForm, updateField }: QueryEditSettingProps) {
    return (
        <section className="space-y-4 shrink-0">
            <h3 className="text-sm font-bold text-primary-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Query Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-primary-muted uppercase tracking-tight text-xs">
                        Name
                    </label>
                    <input
                        type="text"
                        value={queryForm.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="app-input"
                    />
                </div>
            </div>
        </section>
    );
}
