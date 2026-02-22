import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Shield, Key, AlertTriangle, Box, Globe, X } from 'lucide-react';
import { StudioHeader } from '../studio-page/StudioHeader';
import { useAuth } from '../../hooks/use-auth';
import { DatabaseSettings } from './components/DatabaseSettings';
import { AdminSettings } from './components/AdminSettings';
import { AISettings } from './components/AISettings';
import { AddSpaSettings } from './components/AddSpaSettings';
import { CorsSettings } from './components/CorsSettings';


export default function SystemSettingsPage() {
    const { user, hasSuperAdmin, databaseReady } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'database' | 'admin' | 'ai' | 'spa' | 'cors'>('admin');
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    useEffect(() => {
        // Auto-select appropriate tab based on system status
        if (!databaseReady) {
            setActiveTab('database');
        } else if (!hasSuperAdmin) {
            setActiveTab('admin');
        } else if (user) {
            setActiveTab('ai');
        }
    }, [hasSuperAdmin, databaseReady, user]);


    return (
        <div className="min-h-screen bg-app flex flex-col transition-colors duration-300">
            <StudioHeader
                isDark={isDark}
                toggleTheme={toggleTheme}
                showExplorer={false}
                onToggleExplorer={() => { }}
                showChat={false}
                onToggleChat={() => { }}
            />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-app-surface border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 pb-0 relative">
                        <button
                            onClick={() => navigate('/app')}
                            className="absolute top-4 right-4 p-2 hover:bg-app-muted rounded-lg transition-colors text-primary-muted hover:text-primary"
                            title="Close Settings"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                System Settings
                            </h1>
                        </div>
                        <p className="text-primary-muted mb-8">
                            Configure your CMS instance, database connection, and AI integrations.
                        </p>

                        {(databaseReady === false || !hasSuperAdmin) && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                                <h3 className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> System Not Ready
                                </h3>
                                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                                    Complete the following steps to initialize the system:
                                </p>
                                <ul className="text-red-700 dark:text-red-300 text-sm mt-2 ml-4 list-disc space-y-1">
                                    {databaseReady === false && <li>Configure valid database connection</li>}
                                    {!hasSuperAdmin && <li>Create super admin account</li>}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="border-b border-border">
                        <div className="flex gap-1 px-8">
                            {/* Super Admin tab - visible ONLY when super admin is missing */}
                            {(!hasSuperAdmin) && (
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

                            {/* Database tab - visible ONLY when database is NOT ready */}
                            {(!databaseReady) && (
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
                            )}

                            {(user) && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('ai')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-primary-muted hover:text-primary'
                                            }`}
                                    >
                                        <Key className="w-4 h-4" />
                                        AI Providers
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
                                    <button
                                        onClick={() => setActiveTab('cors')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'cors'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-primary-muted hover:text-primary'
                                            }`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        CORS
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-8 min-h-[400px]">
                        {activeTab === 'admin' && !hasSuperAdmin && (
                            <AdminSettings
                                isSystemReady={databaseReady ?? false}
                                hasSuperAdmin={!!hasSuperAdmin}
                            />
                        )}
                        {activeTab === 'database' && !databaseReady && <DatabaseSettings />}
                        {user && activeTab === 'ai' && <AISettings />}
                        {user && activeTab === 'spa' && <AddSpaSettings />}
                        {user && activeTab === 'cors' && <CorsSettings />}
                    </div>
                </div>
            </main>
        </div>
    );
}
