import { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function CorsSettings() {
    const [origins, setOrigins] = useState<string[]>([]);
    const [newOrigin, setNewOrigin] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOrigins();
    }, []);

    const loadOrigins = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/system/cors');
            if (!response.ok) {
                throw new Error('Failed to fetch CORS origins');
            }
            const data = await response.json();
            setOrigins(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load CORS origins:', err);
            setError('Failed to load CORS origins');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrigin = () => {
        if (!newOrigin) return;

        // Basic validation
        try {
            new URL(newOrigin);
        } catch {
            setError('Invalid URL format');
            return;
        }

        if (origins.includes(newOrigin)) {
            setError('Origin already exists');
            return;
        }

        setOrigins([...origins, newOrigin]);
        setNewOrigin('');
        setError(null);
    };

    const handleRemoveOrigin = (originToRemove: string) => {
        setOrigins(origins.filter(o => o !== originToRemove));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/system/cors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(origins),
            });

            if (!response.ok) {
                throw new Error('Failed to save CORS settings');
            }

            toast.success('CORS settings saved. Server restarting...');
            setError(null);

            // Wait for restart
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (err: any) {
            console.error('Failed to save CORS origins:', err);
            setError('Failed to save changes');
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-primary-muted">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        CORS Configuration
                    </h2>
                    <p className="text-sm text-primary-muted mt-1">
                        Manage allowed origins for Cross-Origin Resource Sharing.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md active:scale-95"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            )}

            <div className="bg-app-surface border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-app-subtle/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newOrigin}
                            onChange={(e) => setNewOrigin(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 bg-app-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
                        />
                        <button
                            onClick={handleAddOrigin}
                            disabled={!newOrigin}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Origin
                        </button>
                    </div>
                    <p className="text-xs text-primary-muted mt-2">
                        Enter the full URL including protocol (e.g., https://myapp.com)
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {origins.length === 0 ? (
                        <div className="p-8 text-center text-primary-muted bg-app-subtle/20">
                            No allowed origins configured.
                        </div>
                    ) : (
                        origins.map((origin) => (
                            <div key={origin} className="p-4 flex items-center justify-between group hover:bg-app-subtle/50 transition-colors">
                                <span className="font-mono text-sm">{origin}</span>
                                <button
                                    onClick={() => handleRemoveOrigin(origin)}
                                    className="p-2 text-primary-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Remove origin"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg">
                <strong>Note:</strong> Changes to CORS settings will restart the server. It may take a few moments for the new settings to take effect.
            </div>
        </div>
    );
}
