import { Layout, X, Save, Loader2 } from 'lucide-react';
import { type SchemaDto } from '@cms/shared';

interface PageEditHeaderProps {
    item: SchemaDto;
    activeTab: 'settings' | 'code';
    onTabChange: (tab: 'settings' | 'code') => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
}


export function PageEditHeader({
    item,
    activeTab,
    onTabChange,
    onSave,
    onCancel,
    isSaving
}: PageEditHeaderProps) {

    return (
        <div className="p-4 border-b border-border flex items-center justify-between bg-app-surface shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                    <Layout className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">Editing {item.name}</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-app-muted rounded-full text-primary-muted font-medium uppercase tracking-wider">
                                {item.type}
                            </span>
                            <span className="text-xs text-primary-muted font-mono">{item.schemaId}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center bg-app-muted rounded-lg p-1">
                <button
                    onClick={() => onTabChange('settings')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                >
                    Settings
                </button>
                <button
                    onClick={() => onTabChange('code')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'code' ? 'bg-app-surface text-primary shadow-sm' : 'text-primary-muted hover:text-primary'}`}
                >
                    Source Code
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-app-muted hover:bg-border rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                >
                    {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Save className="w-3.5 h-3.5" />
                    )}
                    Save Changes
                </button>

            </div>
        </div>
    );
}
