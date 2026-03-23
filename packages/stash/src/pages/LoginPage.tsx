import React, { useState } from 'react';
import { useLoginPage } from "@cms/sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
    registerLink
  } = useLoginPage(baseRouter);

  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const onLoginClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid var(--sage-light)',
    background: 'rgba(255,255,255,0.6)',
    fontSize: '0.8rem',
    fontFamily: 'inherit',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 zen-gradient-bg font-outfit">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          width: '100%',
          maxWidth: '340px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🧘</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Sign in to access your stash
          </p>
        </div>

        {/* Tabs - Mocking Zen's tab switcher but linking to register for Sign Up */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1rem',
          background: 'var(--sage-light)',
          borderRadius: '10px',
          padding: '0.2rem',
        }}>
          <button
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'default',
              background: '#fff',
              color: 'var(--sage-dark)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            Login
          </button>
          <a
            href={registerLink}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              textDecoration: 'none',
              textAlign: 'center',
              color: 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sage-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Sign Up
          </a>
        </div>

        {/* Form */}
        <form onSubmit={onLoginClick} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Username or Email
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter username or email"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--sage-light)'}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ ...inputStyle, paddingRight: '2.25rem' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--sage-light)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.2rem',
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  fontSize: '0.7rem',
                  color: '#d44',
                  background: 'rgba(221,68,68,0.06)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(221,68,68,0.15)',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.6rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: 'none',
              cursor: isLoading ? 'default' : 'pointer',
              background: 'var(--sage-dark)',
              color: '#fff',
              opacity: isLoading ? 0.6 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '0.4rem',
            }}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
           <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Don't have an account? <a href={registerLink} style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Register</a>
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
