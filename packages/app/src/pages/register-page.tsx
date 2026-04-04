import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegisterPage } from '@cms/sdk';
import { Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const {
        errors,
        success,
        loginLink,
        userName,
        setUserName,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        handleRegister
    } = useRegisterPage('/app');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await handleRegister();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-app">
            <div className="w-full max-w-md p-8 bg-app-surface border border-border rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center gap-6 mb-8 text-center">
                    <div className="w-16 h-16 bg-primary text-app rounded-2xl flex items-center justify-center shadow-lg">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
                        <p className="text-primary-muted mt-2">Join the workspace today</p>
                    </div>
                </div>

                {success ? (
                    <div className="text-center space-y-6">
                        <p className="text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg border border-green-100 dark:border-green-900/30">
                            Registration succeeded.
                        </p>
                        <Link
                            to="/app/login"
                            className="w-full h-12 bg-primary text-app rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            Click to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold mb-2 ml-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="e.g. sadmin"
                                className="w-full bg-app-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold mb-2 ml-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. admin@example.com"
                                className="w-full bg-app-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all"
                                disabled={isSubmitting}
                                required
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
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 ml-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-app-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-primary-muted transition-all"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {errors.length > 0 && (
                            <div className="space-y-2">
                                {errors.map((error, idx) => (
                                    <p key={idx} className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                        {error}
                                    </p>
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !userName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
                            className="w-full h-12 bg-primary text-app rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                    </form>
                )}

                {!success && (
                    <p className="text-sm text-primary-muted text-center mt-6">
                        Already have an account?{' '}
                        <Link to={loginLink} className="font-bold text-primary hover:underline">
                            Log in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
