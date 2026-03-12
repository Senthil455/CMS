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

            <div className="mt-6 flex items-center justify-between p-4 bg-app/50 border border-border rounded-lg">
                <div>
                    <h4 className="text-sm font-medium text-primary">Enable Visit Tracking</h4>
                    <p className="text-xs text-primary-muted mt-1">Include tracking scripts to monitor page views and user engagement.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!pageForm.metadata?.enableVisitTrack}
                        onChange={(e) => {
                            const currentMetadata = pageForm.metadata || {};
                            onUpdateField('metadata', {
                                ...currentMetadata,
                                enableVisitTrack: e.target.checked
                            });
                        }}
                    />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="mt-6 p-4 bg-app/50 border border-border rounded-lg">
                <div className="mb-3">
                    <h4 className="text-sm font-medium text-primary">Custom Header (Scripts & Styles)</h4>
                    <p className="text-xs text-primary-muted mt-1">
                        Raw HTML injected verbatim into the <code>&lt;head&gt;</code> section during compilation. Useful for custom analytics, external scripts, or global styles.
                    </p>
                </div>
                <textarea
                    value={pageForm.metadata?.customHeader || ''}
                    onChange={(e) => {
                        const currentMetadata = pageForm.metadata || {};
                        onUpdateField('metadata', {
                            ...currentMetadata,
                            customHeader: e.target.value
                        });
                    }}
                    className="app-input w-full font-mono text-xs min-h-[120px] resize-y p-3"
                    placeholder="<script src='https://example.com/script.js'></script>&#10;<style> body { color: red; } </style>"
                />
            </div>
        </section>
    );
}
