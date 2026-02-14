import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { config } from '../../../config';
import { toast } from 'react-hot-toast';

export function GeminiSettings() {
    // Gemini Config State
    const [apiKey, setApiKey] = useState('');
    const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean | null>(null);
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [isGeminiSaving, setIsGeminiSaving] = useState(false);
    const [isGeminiDeleting, setIsGeminiDeleting] = useState(false);

    const fetchGeminiStatus = async () => {
        setIsGeminiLoading(true);
        try {
            const res = await fetch(`${config.API_BASE_URL}/cmsapi/config/gemini`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setIsGeminiConfigured(data.data?.configured ?? false);
                setMaskedKey(data.data?.maskedKey ?? null);
            }
        } catch (err) {
            console.error('Failed to fetch config status', err);
        } finally {
            setIsGeminiLoading(false);
        }
    };

    useEffect(() => {
        fetchGeminiStatus();
    }, []);

    const handleSaveGemini = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        setIsGeminiSaving(true);
        try {
            const res = await fetch(`${config.API_BASE_URL}/cmsapi/config/gemini`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('Gemini API Key updated successfully');
                setApiKey('');
                fetchGeminiStatus();
            } else {
                toast.error('Failed to update API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating settings');
        } finally {
            setIsGeminiSaving(false);
        }
    };

    const handleDeleteGemini = async () => {
        if (!confirm('Are you sure you want to delete the API Key? AI features will stop working.')) return;

        setIsGeminiDeleting(true);
        try {
            const res = await fetch(`${config.API_BASE_URL}/cmsapi/config/gemini`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('Gemini API Key deleted successfully');
                fetchGeminiStatus();
            } else {
                toast.error('Failed to delete API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting settings');
        } finally {
            setIsGeminiDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 p-4 bg-app-muted/50 rounded-lg border border-border">
                <span className="text-sm font-medium text-primary-muted">Current Status:</span>
                {isGeminiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary-muted" />
                ) : isGeminiConfigured ? (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-green-500 font-medium text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Configured & Ready</span>
                        </div>
                        {maskedKey && (
                            <div className="text-xs text-primary-muted font-mono">
                                Current Key: <span className="text-primary">{maskedKey}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>Not Configured</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSaveGemini} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">
                        Update Gemini API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter new API Key..."
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    {isGeminiConfigured && (
                        <button
                            type="button"
                            onClick={handleDeleteGemini}
                            disabled={isGeminiDeleting}
                            className="flex items-center gap-2 px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm active:scale-95"
                        >
                            {isGeminiDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete API Key
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={!apiKey || isGeminiSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                    >
                        {isGeminiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                    </button>
                </div>
            </form>
        </div>
    );
}
