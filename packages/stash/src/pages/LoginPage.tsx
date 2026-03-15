import React, { useState } from 'react';
import { useLoginPage } from "@cms/sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, LogIn, Github, Loader2, AlertCircle } from "lucide-react";

interface LoginPageProps {
  baseRouter: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ baseRouter }) => {
  const {
    error,
    usernameOrEmail,
    setUsernameOrEmail,
    password,
    setPassword,
    handleLogin,
    handleGitHubLogin,
    registerLink
  } = useLoginPage(baseRouter);

  const [isLoading, setIsLoading] = useState(false);

  const onLoginClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const onDemoClick = () => {
    setUsernameOrEmail('admin@example.com');
    setPassword('Admin1!');
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-8 zen-gradient-bg font-outfit">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] p-10 flex flex-col gap-8 rounded-[32px] shadow-zen bg-glass backdrop-blur-zen border border-glass-border"
      >
        <div className="text-center">
          <h1 className="text-[2rem] font-extrabold text-sage-dark mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 text-[0.95rem] font-medium">Sign in to your stash</p>
        </div>

        <form onSubmit={onLoginClick} className="flex flex-col gap-6">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl flex items-center gap-3 text-[0.85rem] font-semibold"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[0.85rem] font-semibold text-sage-dark ml-1">Email</label>
            <div className="flex items-center bg-white/60 border border-glass-border rounded-2xl transition-all duration-300 focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 group">
              <Mail className="ml-4 text-gray-400 flex-shrink-0 group-focus-within:text-primary transition-colors" size={18} />
              <input
                id="email"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full py-4 pl-3 pr-4 bg-transparent border-none outline-none text-[1rem] placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[0.85rem] font-semibold text-sage-dark ml-1">Password</label>
            <div className="flex items-center bg-white/60 border border-glass-border rounded-2xl transition-all duration-300 focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 group">
              <Lock className="ml-4 text-gray-400 flex-shrink-0 group-focus-within:text-primary transition-colors" size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-4 pl-3 pr-4 bg-transparent border-none outline-none text-[1rem] placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="mt-2 w-full py-4 bg-sage-dark text-white rounded-[18px] text-[1rem] font-bold flex items-center justify-center gap-3 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-sage-dark/20 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="flex items-center px-4">
          <div className="flex-1 h-px bg-glass-border"></div>
          <span className="px-4 text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-px bg-glass-border"></div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleGitHubLogin} 
            className="flex-1 py-3.5 bg-white/50 border border-glass-border rounded-2xl text-sage-dark text-[0.91rem] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/80 hover:border-primary-light hover:translate-y-[-2px] hover:shadow-sm"
          >
            <Github size={18} />
            <span>GitHub</span>
          </button>

          <button 
            onClick={onDemoClick}
            className="flex-1 py-3.5 bg-white/50 border border-glass-border rounded-2xl text-sage-dark text-[0.91rem] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/80 hover:border-primary-light hover:translate-y-[-2px] hover:shadow-sm"
          >
            <span>Demo Account</span>
          </button>
        </div>

        <div className="text-center text-[0.9rem] text-gray-500">
          <p>Don't have an account? <a href={registerLink} className="text-primary font-bold hover:underline">Register</a></p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
