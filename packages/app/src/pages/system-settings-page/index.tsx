import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Shield, Key, AlertTriangle, Box, Globe, ArrowLeft, Settings, Palette } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { DatabaseSettings } from './components/DatabaseSettings';
import { AdminSettings } from './components/AdminSettings';
import { AISettings } from './components/AISettings';
import { AddSpaSettings } from './components/AddSpaSettings';
import { CorsSettings } from './components/CorsSettings';
import { StyleSettings } from './components/StyleSettings';

type SettingsTab = 'database' | 'admin' | 'ai' | 'spa' | 'cors' | 'styles';

interface NavItem {
    id: SettingsTab;
    label: string;
    icon: React.ReactNode;
    show: boolean;
}

export default function SystemSettingsPage() {
    const { user, hasSuperAdmin, databaseReady } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('admin');

    useEffect(() => {
        if (!databaseReady) {
            setActiveTab('database');
        } else if (!hasSuperAdmin) {
            setActiveTab('admin');
        } else if (user) {
            setActiveTab('ai');
        }
    }, [hasSuperAdmin, databaseReady, user]);

    const navItems: NavItem[] = [
        { id: 'admin', label: 'Super Admin', icon: <Shield className="w-4 h-4" />, show: !hasSuperAdmin },
        { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" />, show: !databaseReady },
        { id: 'ai', label: 'AI Providers', icon: <Key className="w-4 h-4" />, show: !!user },
        { id: 'styles', label: 'Design Styles', icon: <Palette className="w-4 h-4" />, show: !!user },
        { id: 'spa', label: 'Add SPA', icon: <Box className="w-4 h-4" />, show: !!user },
        { id: 'cors', label: 'CORS', icon: <Globe className="w-4 h-4" />, show: !!user },
    ];

    const visibleNavItems = navItems.filter(item => item.show);

    return (
        <div className="fixed inset-0 bg-app flex flex-col">
            {/* Top bar */}
            <div className="h-12 border-b border-border bg-app-surface flex items-center px-4 shrink-0">
                <button
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-2 text-sm text-primary-muted hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Studio
                </button>
                <div className="flex items-center gap-2 mx-auto">
                    <Settings className="w-4 h-4 text-primary-muted" />
                    <span className="text-sm font-semibold">System Settings</span>
                </div>
                <div className="w-24" /> {/* Spacer for centering */}
            </div>

            {/* Main content: nav + settings */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left nav panel */}
                <div className="w-56 border-r border-border bg-app-surface flex flex-col shrink-0">
                    {/* Warning banner */}
                    {(databaseReady === false || !hasSuperAdmin) && (
                        <div className="p-3 border-b border-border">
                            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Setup required</span>
                            </div>
                        </div>
                    )}

                    {/* Nav items */}
                    <nav className="flex-1 py-2 overflow-y-auto">
                        {visibleNavItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === item.id
                                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                    : 'text-primary-muted hover:text-primary hover:bg-app-muted/50'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right settings panel */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-8">
                        {activeTab === 'admin' && !hasSuperAdmin && (
                            <AdminSettings
                                isSystemReady={databaseReady ?? false}
                                hasSuperAdmin={!!hasSuperAdmin}
                            />
                        )}
                        {activeTab === 'database' && !databaseReady && <DatabaseSettings />}
                        {user && activeTab === 'ai' && <AISettings />}
                        {user && activeTab === 'styles' && <StyleSettings />}
                        {user && activeTab === 'spa' && <AddSpaSettings />}
                        {user && activeTab === 'cors' && <CorsSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
}
