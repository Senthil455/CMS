import { useState } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../hooks/use-auth';

interface AdminSettingsProps {
    isSystemReady: boolean;
    hasSuperAdmin: boolean;
}

export function AdminSettings({ isSystemReady, hasSuperAdmin }: AdminSettingsProps) {
    const [adminParams, setAdminParams] = useState({ username: '', email: '', password: '', repeatPassword: '' });
    const [isAdminSaving, setIsAdminSaving] = useState(false);
    const { checkSystemStatus } = useAuth();

    const handleSaveAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdminSaving(true);

        const isRootSetup = isSystemReady && !hasSuperAdmin;

        if (!adminParams.email || !adminParams.password || (!isRootSetup && !adminParams.username)) {
            toast.error('Please fill in all fields');
            setIsAdminSaving(false);
            return;
        }

        if (adminParams.password !== adminParams.repeatPassword) {
            toast.error('Passwords do not match');
            setIsAdminSaving(false);
            return;
        }

        try {
            const endpoint = isRootSetup ? '/api/system/setup-super-admin' : `/api/register`;
            const payload = isRootSetup
                ? { email: adminParams.email, password: adminParams.password }
                : { username: adminParams.username, email: adminParams.email, password: adminParams.password };

            const res = await fetch(`${''}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success(isRootSetup ? 'Root Admin created successfully' : 'Admin account created successfully');
                setAdminParams({ username: '', email: '', password: '', repeatPassword: '' });

                if (isRootSetup) {
                    // Force refresh system status before redirecting
                    await checkSystemStatus();
                    // Small delay to ensure state propagates
                    setTimeout(() => window.location.href = '/app/login', 500);
                }
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to create admin account');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error creating admin account');
        } finally {
            setIsAdminSaving(false);
        }
    };

    return (
        <form onSubmit={handleSaveAdmin} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                            {isSystemReady && !hasSuperAdmin ? 'Root User Setup' : 'Admin Account Setup'}
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            {isSystemReady && !hasSuperAdmin
                                ? 'System is ready but has no users. Please create the Super Admin account.'
                                : 'Use this form to create additional admin accounts.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {!(isSystemReady && !hasSuperAdmin) && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary-muted">Username</label>
                        <input
                            type="text"
                            value={adminParams.username}
                            onChange={(e) => setAdminParams({ ...adminParams, username: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="admin"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">Email</label>
                    <input
                        type="email"
                        value={adminParams.email}
                        onChange={(e) => setAdminParams({ ...adminParams, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="admin@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">Password</label>
                    <input
                        type="password"
                        value={adminParams.password}
                        onChange={(e) => setAdminParams({ ...adminParams, password: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">Repeat Password</label>
                    <input
                        type="password"
                        value={adminParams.repeatPassword}
                        onChange={(e) => setAdminParams({ ...adminParams, repeatPassword: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isAdminSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                >
                    {isAdminSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Create Admin Account
                </button>
            </div>
        </form>
    );
}
