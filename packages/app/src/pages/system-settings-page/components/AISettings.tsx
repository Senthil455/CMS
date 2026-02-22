import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AISettings() {
    // Config States
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');

    const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; maskedKey: string | null } | null>(null);
    const [openaiStatus, setOpenaiStatus] = useState<{ configured: boolean; maskedKey: string | null } | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    // Saving States
    const [isSavingGemini, setIsSavingGemini] = useState(false);
    const [isSavingOpenai, setIsSavingOpenai] = useState(false);

    // Deleting States
    const [isDeletingGemini, setIsDeletingGemini] = useState(false);
    const [isDeletingOpenai, setIsDeletingOpenai] = useState(false);

    const fetchStatus = async () => {
        setIsLoading(true);
        try {
            const [geminiRes, openaiRes] = await Promise.all([
                fetch(`${''}/cmsapi/config/gemini`, { credentials: 'include' }),
                fetch(`${''}/cmsapi/config/openai`, { credentials: 'include' })
            ]);

            if (geminiRes.ok) {
                const data = await geminiRes.json();
                setGeminiStatus(data.data ?? { configured: false, maskedKey: null });
            }

            if (openaiRes.ok) {
                const data = await openaiRes.json();
                setOpenaiStatus(data.data ?? { configured: false, maskedKey: null });
            }
        } catch (err) {
            console.error('Failed to fetch config status', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSaveGemini = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!geminiKey) return;

        setIsSavingGemini(true);
        try {
            const res = await fetch(`${''}/cmsapi/config/gemini`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: geminiKey }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('Gemini API Key updated successfully');
                setGeminiKey('');
                fetchStatus();
            } else {
                toast.error('Failed to update Gemini API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating settings');
        } finally {
            setIsSavingGemini(false);
        }
    };

    const handleDeleteGemini = async () => {
        if (!confirm('Are you sure you want to delete the Gemini API Key? AI features using Gemini will stop working.')) return;

        setIsDeletingGemini(true);
        try {
            const res = await fetch(`${''}/cmsapi/config/gemini`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('Gemini API Key deleted successfully');
                fetchStatus();
            } else {
                toast.error('Failed to delete Gemini API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting settings');
        } finally {
            setIsDeletingGemini(false);
        }
    };

    const handleSaveOpenai = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!openaiKey) return;

        setIsSavingOpenai(true);
        try {
            const res = await fetch(`${''}/cmsapi/config/openai`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: openaiKey }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('OpenAI API Key updated successfully');
                setOpenaiKey('');
                fetchStatus();
            } else {
                toast.error('Failed to update OpenAI API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating settings');
        } finally {
            setIsSavingOpenai(false);
        }
    };

    const handleDeleteOpenai = async () => {
        if (!confirm('Are you sure you want to delete the OpenAI API Key? AI features using OpenAI will stop working.')) return;

        setIsDeletingOpenai(true);
        try {
            const res = await fetch(`${''}/cmsapi/config/openai`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('OpenAI API Key deleted successfully');
                fetchStatus();
            } else {
                toast.error('Failed to delete OpenAI API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error deleting settings');
        } finally {
            setIsDeletingOpenai(false);
        }
    };

    if (isLoading && !geminiStatus && !openaiStatus) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-muted" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Gemini Section */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Google Gemini Configuration</h3>
                <div className="flex items-center gap-3 p-4 bg-app-muted/50 rounded-lg border border-border">
                    <span className="text-sm font-medium text-primary-muted">Current Status:</span>
                    {geminiStatus?.configured ? (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-green-500 font-medium text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Configured & Ready</span>
                            </div>
                            {geminiStatus.maskedKey && (
                                <div className="text-xs text-primary-muted font-mono">
                                    Current Key: <span className="text-primary">{geminiStatus.maskedKey}</span>
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
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="Enter new Gemini API Key..."
                            className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        {geminiStatus?.configured && (
                            <button
                                type="button"
                                onClick={handleDeleteGemini}
                                disabled={isDeletingGemini}
                                className="flex items-center gap-2 px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm active:scale-95"
                            >
                                {isDeletingGemini ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete API Key
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!geminiKey || isSavingGemini}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                        >
                            {isSavingGemini ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>

            <hr className="border-border" />

            {/* OpenAI Section */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">OpenAI Configuration</h3>
                <div className="flex items-center gap-3 p-4 bg-app-muted/50 rounded-lg border border-border">
                    <span className="text-sm font-medium text-primary-muted">Current Status:</span>
                    {openaiStatus?.configured ? (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-green-500 font-medium text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Configured & Ready</span>
                            </div>
                            {openaiStatus.maskedKey && (
                                <div className="text-xs text-primary-muted font-mono">
                                    Current Key: <span className="text-primary">{openaiStatus.maskedKey}</span>
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

                <form onSubmit={handleSaveOpenai} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary-muted">
                            Update OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            placeholder="Enter new OpenAI API Key..."
                            className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        {openaiStatus?.configured && (
                            <button
                                type="button"
                                onClick={handleDeleteOpenai}
                                disabled={isDeletingOpenai}
                                className="flex items-center gap-2 px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm active:scale-95"
                            >
                                {isDeletingOpenai ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete API Key
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!openaiKey || isSavingOpenai}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                        >
                            {isSavingOpenai ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
