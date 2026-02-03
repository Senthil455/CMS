import { useState, useEffect } from 'react';
import { Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { StudioHeader } from '../studio-page/StudioHeader';
import { useAuth } from '../../hooks/use-auth';
import { config } from '../../config';
import { toast } from 'react-hot-toast';

export default function SystemSettingsPage() {
    const { user, logout } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${config.API_BASE_URL}/cmsapi/config/gemini`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setIsConfigured(data.data?.configured ?? false);
                setMaskedKey(data.data?.maskedKey ?? null);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        setIsSaving(true);
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
                fetchStatus();
            } else {
                toast.error('Failed to update API Key');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error updating settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-app flex flex-col transition-colors duration-300">
            <StudioHeader
                user={user}
                logout={logout}
                isDark={isDark}
                toggleTheme={toggleTheme}
                showExplorer={false}
                onToggleExplorer={() => { }}
                showChat={false}
                onToggleChat={() => { }}
            />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-app-surface border border-border rounded-xl p-8 shadow-sm">
                    <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        System Settings
                    </h1>

                    <section className="mb-8">
                        <h2 className="text-lg font-semibold mb-4 text-primary">Gemini AI Configuration</h2>

                        <div className="flex items-center gap-3 mb-6 p-4 bg-app-muted/50 rounded-lg border border-border">
                            <span className="text-sm font-medium text-primary-muted">Current Status:</span>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary-muted" />
                            ) : isConfigured ? (
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

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary-muted">
                                    Update Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter new API Key to update..."
                                    className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                <p className="text-xs text-primary-muted mt-2">
                                    This key will be stored in memory and used for AI operations. It will be lost if the server restarts.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!apiKey || isSaving}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Configuration
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
