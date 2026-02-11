import { useState, useEffect } from 'react';
import { Database, Shield, Key, AlertTriangle, Box, Lock } from 'lucide-react';
import { StudioHeader } from '../studio-page/StudioHeader';
import { useAuth } from '../../hooks/use-auth';
import { DatabaseSettings } from './components/DatabaseSettings';
import { AdminSettings } from './components/AdminSettings';
import { GeminiSettings } from './components/GeminiSettings';
import { AddSpaSettings } from './components/AddSpaSettings';
import { MasterPasswordSettings } from './components/MasterPasswordSettings';

export default function SystemSettingsPage() {
    const { user, logout, hasMasterPassword, hasUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'database' | 'masterPassword' | 'admin' | 'gemini' | 'spa'>('masterPassword');
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    useEffect(() => {
        // Auto-select appropriate tab based on system status
        if (!hasMasterPassword) {
            setActiveTab('masterPassword');
        } else if (!hasUser) {
            setActiveTab('admin');
        }
    }, [hasMasterPassword, hasUser]);


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
                <div className="bg-app-surface border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 pb-0">
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            System Settings
                        </h1>
                        <p className="text-primary-muted mb-8">
                            Configure your CMS instance, database connection, and AI integrations.
                        </p>

                        {(!hasMasterPassword || !hasUser) && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                                <h3 className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> System Not Ready
                                </h3>
                                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                                    Complete the following steps to initialize the system:
                                </p>
                                <ul className="text-red-700 dark:text-red-300 text-sm mt-2 ml-4 list-disc space-y-1">
                                    {!hasMasterPassword && <li>Set master password</li>}
                                    {!hasUser && <li>Create super admin account</li>}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="border-b border-border">
                        <div className="flex gap-1 px-8">
                            {/* Master Password tab - always visible during setup */}
                            <button
                                onClick={() => setActiveTab('masterPassword')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'masterPassword'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-primary-muted hover:text-primary'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Master Password
                            </button>

                            {/* Super Admin tab - visible when master password is set */}
                            {hasMasterPassword && (
                                <button
                                    onClick={() => setActiveTab('admin')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'admin'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-primary-muted hover:text-primary'
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Super Admin
                                </button>
                            )}

                            {/* Database and other tabs - only visible after full setup + login */}
                            {user && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('database')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'database'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-primary-muted hover:text-primary'
                                            }`}
                                    >
                                        <Database className="w-4 h-4" />
                                        Database
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('gemini')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'gemini'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-primary-muted hover:text-primary'
                                            }`}
                                    >
                                        <Key className="w-4 h-4" />
                                        Gemini AI
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('spa')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'spa'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-primary-muted hover:text-primary'
                                            }`}
                                    >
                                        <Box className="w-4 h-4" />
                                        Add SPA
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-8 min-h-[400px]">
                        {activeTab === 'masterPassword' && <MasterPasswordSettings hasMasterPassword={!!hasMasterPassword} />}
                        {activeTab === 'admin' && hasMasterPassword && (
                            <AdminSettings
                                isSystemReady={!!hasMasterPassword}
                                hasUser={!!hasUser}
                            />
                        )}
                        {user && activeTab === 'database' && <DatabaseSettings />}
                        {user && activeTab === 'gemini' && <GeminiSettings />}
                        {user && activeTab === 'spa' && <AddSpaSettings />}
                    </div>
                </div>
            </main>
        </div>
    );
}
