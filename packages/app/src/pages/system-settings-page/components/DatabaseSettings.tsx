import { useState, useEffect } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { config } from '../../../config';
import { toast } from 'react-hot-toast';

const DatabaseProvider = {
    Sqlite: 0,
    Postgres: 1,
    SqlServer: 2,
    Mysql: 3,
} as const;

type DatabaseProviderType = typeof DatabaseProvider[keyof typeof DatabaseProvider];

const PROVIDERS = [
    { value: DatabaseProvider.Sqlite, label: 'SQLite' },
    { value: DatabaseProvider.Postgres, label: 'PostgreSQL' },
    { value: DatabaseProvider.Mysql, label: 'MySQL' },
    { value: DatabaseProvider.SqlServer, label: 'SQL Server' },
];

export function DatabaseSettings() {
    // Database Config State
    const [dbProvider, setDbProvider] = useState<DatabaseProviderType>(DatabaseProvider.Sqlite);
    const [dbParams, setDbParams] = useState({
        filename: 'cms.db',
        host: 'localhost',
        database: 'cms',
        username: 'cmsuser',
        password: '',
        port: '5432'
    });
    const [connectionString, setConnectionString] = useState('');
    const [isDbSaving, setIsDbSaving] = useState(false);

    // Initial load of config
    // We can assume this component is only mounted when we want to configure DB or view it.
    // If DB is ready, connectionString will be populated from API.
    // If not, it will be empty.

    // Fetch current config on mount
    useEffect(() => {
        fetch(`${config.CMS_BASE_URL}/api/system/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch config');
            })
            .then(data => {
                setDbProvider(data.databaseProvider ?? DatabaseProvider.Sqlite);
                setConnectionString(data.connectionString ?? '');
            })
            .catch(() => {
                // Ignore error if config doesn't exist yet
            });
    }, []);

    const generateConnectionString = () => {
        switch (dbProvider) {
            case DatabaseProvider.Sqlite:
                return `Data Source=${dbParams.filename}`;
            case DatabaseProvider.Postgres:
                return `Host=${dbParams.host};Port=${dbParams.port};Database=${dbParams.database};Username=${dbParams.username};Password=${dbParams.password}`;
            case DatabaseProvider.Mysql:
                return `Server=${dbParams.host};Port=${dbParams.port};Database=${dbParams.database};User=${dbParams.username};Password=${dbParams.password}`;
            case DatabaseProvider.SqlServer:
                return `Server=${dbParams.host},${dbParams.port};Database=${dbParams.database};User Id=${dbParams.username};Password=${dbParams.password};TrustServerCertificate=True;`;
            default:
                return '';
        }
    };

    const handleSaveDatabase = async (e: React.FormEvent) => {
        e.preventDefault();

        if (connectionString) {
            toast.error('Database is already configured. To change it, please delete the configuration file on the server.');
            return;
        }

        setIsDbSaving(true);
        const newConnectionString = generateConnectionString();
        try {
            const res = await fetch(`${config.CMS_BASE_URL}/api/system/config/database`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    databaseProvider: dbProvider,
                    connectionString: newConnectionString
                }),
                credentials: 'include'
            });

            if (res.ok) {
                toast.success('Database configuration saved. Server restarting...');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save database configuration');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error saving database configuration');
        } finally {
            setIsDbSaving(false);
        }
    };

    // If connection string is set, show read-only view
    if (connectionString) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                        <Save className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Database is Configured</h3>
                    <p className="text-sm text-primary-muted mb-6 max-w-md">
                        The database connection is currently active.
                    </p>

                    <div className="bg-app-muted rounded-lg p-4 w-full max-w-md text-left mb-6">
                        <label className="block text-xs font-semibold uppercase text-primary-muted mb-1">Current Connection String</label>
                        <code className="text-sm font-mono text-primary break-all">
                            {connectionString}
                        </code>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 max-w-md text-left">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                    Need to reconfigure?
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                    To change the database configuration, you must manually delete the <strong>settings.json</strong> file on your server and restart the application.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSaveDatabase} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">


            <div>
                <label className="block text-sm font-medium mb-2 text-primary">Database Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PROVIDERS.map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => setDbProvider(p.value)}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${dbProvider === p.value
                                ? 'bg-primary text-app border-primary shadow-md transform scale-[1.02]'
                                : 'bg-app-muted border-border hover:bg-app-muted/80 text-primary-muted'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-app-muted/30 p-6 rounded-xl border border-border space-y-4">
                {dbProvider === DatabaseProvider.Sqlite && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary-muted">Database Filename</label>
                        <input
                            type="text"
                            value={dbParams.filename}
                            onChange={(e) => setDbParams({ ...dbParams, filename: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="cms.db"
                        />
                        <p className="text-xs text-primary-muted mt-2">
                            The SQLite database file will be created in the server's execution directory.
                        </p>
                    </div>
                )}

                {dbProvider !== DatabaseProvider.Sqlite && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary-muted">Host</label>
                                <input
                                    type="text"
                                    value={dbParams.host}
                                    onChange={(e) => setDbParams({ ...dbParams, host: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="localhost"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary-muted">Port</label>
                                <input
                                    type="text"
                                    value={dbParams.port}
                                    onChange={(e) => setDbParams({ ...dbParams, port: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="5432"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary-muted">Database Name</label>
                                <input
                                    type="text"
                                    value={dbParams.database}
                                    onChange={(e) => setDbParams({ ...dbParams, database: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="cms"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary-muted">Username</label>
                                <input
                                    type="text"
                                    value={dbParams.username}
                                    onChange={(e) => setDbParams({ ...dbParams, username: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="cmsuser"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary-muted">Password</label>
                                <input
                                    type="password"
                                    value={dbParams.password}
                                    onChange={(e) => setDbParams({ ...dbParams, password: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-app border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>



            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isDbSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-app rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg active:scale-95"
                >
                    {isDbSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save & Restart Server
                </button>
            </div>
        </form>
    );
}
