import React, { useState } from 'react';
import { useRegisterPage } from "@cms/sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface RegisterPageProps {
  baseRouter: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ baseRouter }) => {
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
  } = useRegisterPage(baseRouter);

  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const onRegisterClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleRegister();
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
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🌱</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
            Create Account
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Join stash today
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--sage-dark)', marginBottom: '1rem' }}>
              Registration succeeded.
            </p>
            <a href={loginLink} style={{
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              background: 'var(--sage-dark)',
              color: '#fff',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Click here to go to login
            </a>
          </div>
        ) : (
          <>
            <form onSubmit={onRegisterClick} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter username"
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  style={inputStyle}
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
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem',
                    }}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    style={{ ...inputStyle, paddingRight: '2.25rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{
                      position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem',
                    }}
                  >
                    {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {errors.map((error, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      fontSize: '0.7rem', color: '#d44', background: 'rgba(221,68,68,0.06)',
                      padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(221,68,68,0.15)',
                      marginTop: '0.2rem'
                    }}
                  >
                    {error}
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '0.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.8rem',
                  border: 'none', cursor: isLoading ? 'default' : 'pointer', background: 'var(--sage-dark)',
                  color: '#fff', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.4rem',
                }}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Already have an account? <a href={loginLink} style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Login</a>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;
