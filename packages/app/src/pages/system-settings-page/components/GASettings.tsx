import { useState, useEffect } from 'react';
import { Save, Loader2, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function GASettings() {
    const [enabled, setEnabled] = useState(false);
    const [measurementId, setMeasurementId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/cmsapi/config/analytics', { credentials: 'include' });
            if (res.ok) {
                const { data } = await res.json();
                setEnabled(data.enabled ?? false);
                setMeasurementId(data.measurementId ?? '');
            }
        } catch (err) {
            console.error('Failed to load Google Analytics settings', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (enabled && !measurementId.trim()) {
            toast.error('Please enter a Measurement ID before enabling Google Analytics.');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/cmsapi/config/analytics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enabled, measurementId: measurementId.trim() })
            });
            if (res.ok) {
                toast.success('Google Analytics settings saved.');
            } else {
                toast.error('Failed to save Google Analytics settings.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error saving settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-muted" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    Google Analytics
                </h2>
                <p className="text-sm text-primary-muted mt-1">
                    When enabled, the gtag.js snippet is injected into every compiled page's{' '}
                    <code>&lt;head&gt;</code>, allowing you to track page views in Google Analytics 4.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-4 bg-app/50 border border-border rounded-lg">
                    <div>
                        <h4 className="text-sm font-medium text-primary">Enable Google Analytics</h4>
                        <p className="text-xs text-primary-muted mt-1">
                            Inject the gtag.js tracking script into all compiled pages.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                </div>

                {/* Measurement ID input */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">
                        Measurement ID
                    </label>
                    <input
                        type="text"
                        value={measurementId}
                        onChange={(e) => setMeasurementId(e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-sm"
                    />
                    <p className="text-xs text-primary-muted mt-1">
                        Find this in your Google Analytics 4 property under Admin → Data Streams.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
