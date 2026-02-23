import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DesignStyle {
    id: number;
    name: string;
    displayName: string;
    description: string;
    listPrompt: string;
    detailPrompt: string;
}

interface StyleForm {
    name: string;
    displayName: string;
    description: string;
    listPrompt: string;
    detailPrompt: string;
}

const emptyForm: StyleForm = { name: '', displayName: '', description: '', listPrompt: '', detailPrompt: '' };

export function StyleSettings() {
    const [styles, setStyles] = useState<DesignStyle[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<StyleForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchStyles = useCallback(async () => {
        try {
            const res = await fetch('/cmsapi/design-styles', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setStyles(data.data);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStyles(); }, [fetchStyles]);

    const handleCreate = async () => {
        if (!form.name || !form.displayName) {
            toast.error('Name and display name are required');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/cmsapi/design-styles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Style created');
                setIsCreating(false);
                setForm(emptyForm);
                fetchStyles();
            } else {
                toast.error(data.error || 'Failed to create style');
            }
        } catch { toast.error('Failed to create style'); } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (editingId === null) return;
        setSaving(true);
        try {
            const res = await fetch(`/cmsapi/design-styles/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Style updated');
                setEditingId(null);
                setForm(emptyForm);
                fetchStyles();
            } else {
                toast.error(data.error || 'Failed to update style');
            }
        } catch { toast.error('Failed to update style'); } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this style?')) return;
        try {
            const res = await fetch(`/cmsapi/design-styles/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Style deleted');
                fetchStyles();
            } else {
                toast.error(data.error || 'Failed to delete');
            }
        } catch { toast.error('Failed to delete style'); }
    };

    const startEdit = (style: DesignStyle) => {
        setEditingId(style.id);
        setIsCreating(false);
        setForm({
            name: style.name,
            displayName: style.displayName,
            description: style.description,
            listPrompt: style.listPrompt,
            detailPrompt: style.detailPrompt,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsCreating(false);
        setForm(emptyForm);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-muted" />
            </div>
        );
    }

    const showForm = isCreating || editingId !== null;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Design Styles</h2>
                    <p className="text-sm text-primary-muted mt-1">
                        Manage template styles used to guide AI page generation.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setIsCreating(true); setEditingId(null); setForm(emptyForm); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-app rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Add Style
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-app-muted/30 border border-border rounded-lg p-5 mb-6">
                    <h3 className="font-semibold mb-4">{isCreating ? 'Create New Style' : 'Edit Style'}</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-primary-muted mb-1">Name (slug)</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. modern"
                                    className="w-full px-3 py-2 bg-app border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-primary-muted mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={form.displayName}
                                    onChange={e => setForm({ ...form, displayName: e.target.value })}
                                    placeholder="e.g. Modern Editorial"
                                    className="w-full px-3 py-2 bg-app border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-primary-muted mb-1">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Short description for template selection"
                                className="w-full px-3 py-2 bg-app border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-primary-muted mb-1">List Page Prompt</label>
                            <textarea
                                value={form.listPrompt}
                                onChange={e => setForm({ ...form, listPrompt: e.target.value })}
                                placeholder="Style instructions for list pages..."
                                rows={5}
                                className="w-full px-3 py-2 bg-app border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-primary-muted mb-1">Detail Page Prompt</label>
                            <textarea
                                value={form.detailPrompt}
                                onChange={e => setForm({ ...form, detailPrompt: e.target.value })}
                                placeholder="Style instructions for detail pages..."
                                rows={5}
                                className="w-full px-3 py-2 bg-app border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm text-primary-muted hover:text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={isCreating ? handleCreate : handleUpdate}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-app rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isCreating ? 'Create' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Style List */}
            <div className="space-y-2">
                {styles.length === 0 && !showForm && (
                    <p className="text-sm text-primary-muted text-center py-8">No styles yet. Click "Add Style" to create one.</p>
                )}
                {styles.map(style => (
                    <div
                        key={style.id}
                        className={`border border-border rounded-lg p-4 transition-colors ${editingId === style.id ? 'border-primary/50 bg-primary/5' : 'hover:bg-app-muted/30'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{style.displayName}</span>
                                    <span className="text-xs text-primary-muted px-1.5 py-0.5 bg-app-muted rounded font-mono">{style.name}</span>
                                </div>
                                <p className="text-xs text-primary-muted mt-1">{style.description}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => startEdit(style)}
                                    className="p-1.5 text-primary-muted hover:text-primary hover:bg-app-muted rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(style.id)}
                                    className="p-1.5 text-primary-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
