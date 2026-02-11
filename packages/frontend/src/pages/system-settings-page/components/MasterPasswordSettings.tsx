import { useState } from 'react';
import { Lock, Save, Loader2 } from 'lucide-react';
import { config } from '../../../config';
import { toast } from 'react-hot-toast';

interface MasterPasswordSettingsProps {
    hasMasterPassword?: boolean;
}

export function MasterPasswordSettings({ hasMasterPassword }: MasterPasswordSettingsProps) {
    const [oldMasterPassword, setOldMasterPassword] = useState('');
    const [masterPassword, setMasterPassword] = useState('');
    const [repeatMasterPassword, setRepeatMasterPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveMasterPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!masterPassword) {
            toast.error('Master password is required');
            return;
        }

        if (masterPassword !== repeatMasterPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (masterPassword.length < 8) {
            toast.error('Master password must be at least 8 characters');
            return;
        }

        if (hasMasterPassword && !oldMasterPassword) {
            toast.error('Current master password is required');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${config.CMS_BASE_URL}/api/system/config/master-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    masterPassword,
                    ...(hasMasterPassword ? { oldMasterPassword } : {})
                }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('Master password saved successfully!');
                setOldMasterPassword('');
                setMasterPassword('');
                setRepeatMasterPassword('');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save master password');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error saving master password');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSaveMasterPassword} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 mb-6">
                <h3 className="text-blue-800 dark:text-blue-400 font-semibold flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    {hasMasterPassword ? 'Change Master Password' : 'Why Set a Master Password?'}
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {hasMasterPassword
                        ? 'Enter your current master password to verify your identity, then set a new one.'
                        : 'The master password is saved in the server\'s configuration file and allows you to:'
                    }
                </p>
                {!hasMasterPassword && (
                    <>
                        <ul className="text-blue-700 dark:text-blue-300 text-sm mt-2 ml-4 list-disc space-y-1">
                            <li>Update database settings if the database becomes unreachable</li>
                            <li>Modify system configuration without database access</li>
                            <li>Recover from database connection failures</li>
                        </ul>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mt-2 font-medium">
                            ⚠️ Keep this password safe - you'll need it for future system updates!
                        </p>
                    </>
                )}
            </div>

            <div className="bg-app-muted/30 p-6 rounded-xl border border-border space-y-4">
                {hasMasterPassword && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary-muted">
                            Current Master Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={oldMasterPassword}
                            onChange={(e) => setOldMasterPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Enter your current master password"
                            required
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">
                        {hasMasterPassword ? 'New Master Password' : 'Master Password'} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Enter a strong master password (min 8 characters)"
                        required
                        minLength={8}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-primary-muted">
                        {hasMasterPassword ? 'Confirm New Master Password' : 'Confirm Master Password'} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={repeatMasterPassword}
                        onChange={(e) => setRepeatMasterPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Repeat master password"
                        required
                        minLength={8}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {hasMasterPassword ? 'Change Master Password' : 'Save Master Password'}
                </button>
            </div>
        </form>
    );
}
