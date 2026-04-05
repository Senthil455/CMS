import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { useSocketContext } from '../context/socket-provider';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, hasSuperAdmin } = useAuth();
    const { refreshConnection } = useSocketContext();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to settings if system is not fully ready
        if (hasSuperAdmin === false) {
            navigate('/app/settings');
        }
    }, [hasSuperAdmin, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usernameOrEmail.trim() || !password.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const result: any = await login(usernameOrEmail, password);
            if (!result || result.error || result.success === false) {
                setError(result?.error || 'Login failed');
            } else if (result.allowedMenus && !result.allowedMenus.includes('menu_schema_builder')) {
                setError("You don't have privileges to access this workspace");
                // Immediately clear their session if they shouldn't log in
                import('@cms/sdk').then(({ getApiClient }) => getApiClient().logout().catch(() => {}));
            } else {
                refreshConnection();
                navigate('/app');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-app">
            <div className="w-full max-w-md p-8 bg-app-surface border border-border rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center gap-6 mb-8 text-center">
                    <div className="w-16 h-16 bg-primary text-app rounded-2xl flex items-center justify-center shadow-lg">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">CMS AI</h1>
                        <p className="text-primary-muted mt-2">Enter your credentials to access the workspace</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-semibold mb-2 ml-1">
                            Username or Email
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            placeholder="e.g. admin@example.com"
                            className="w-full bg-app-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold mb-2 ml-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-app-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all"
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !usernameOrEmail.trim() || !password.trim()}
                        className="w-full h-12 bg-primary text-app rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                    
                    <p className="text-sm text-primary-muted text-center mt-6 mb-2">
                        Don't have an account?{' '}
                        <Link to="/app/register" className="font-bold text-primary hover:underline">
                            Register
                        </Link>
                    </p>

                    <p className="text-[10px] text-primary-muted text-center uppercase tracking-widest font-bold opacity-40">
                        Secure Authentication demo
                    </p>
                </form>
            </div>
        </div>
    );
}
