import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckCircle2, Target, BarChart3, Compass, Loader2, LogIn, LogOut, X, Eye, EyeOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Goals from './pages/Goals'
import Trends from './pages/Trends'
import Explore from './pages/Explore'
import './index.css'

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'register' | 'login'>('login')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!userName.trim() || !password.trim()) {
          setError('Username and password are required')
          setLoading(false)
          return
        }
        const res = await register(userName.trim(), email.trim(), password)
        if (!res.ok) { setError(res.error || 'Registration failed'); setLoading(false); return }
      } else {
        if (!userName.trim() || !password.trim()) {
          setError('Username and password are required')
          setLoading(false)
          return
        }
        const res = await login(userName.trim(), password)
        if (!res.ok) { setError(res.error || 'Login failed'); setLoading(false); return }
      }
      onClose()
      window.location.reload()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px',
    border: '1px solid var(--sage-light)', background: 'rgba(255,255,255,0.6)',
    fontSize: '0.8rem', fontFamily: 'inherit', color: 'var(--text-main)',
    outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '340px',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
          borderRadius: '20px', padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '0.25rem',
        }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🧘</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {mode === 'register' ? 'Sync your progress across devices' : 'Sign in to access your data'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1rem',
          background: 'var(--sage-light)', borderRadius: '10px', padding: '0.2rem',
        }}>
          {(['register', 'login'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '0.4rem', borderRadius: '8px',
                fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? 'var(--sage-dark)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'register' ? 'Sign Up' : 'Login'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              {mode === 'register' ? 'Username' : 'Username or Email'}
            </label>
            <input
              type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder={mode === 'register' ? 'Choose a username' : 'Enter username or email'}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={e => e.target.style.borderColor = 'var(--sage-light)'}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Email <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={e => e.target.style.borderColor = 'var(--sage-light)'}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ ...inputStyle, paddingRight: '2.25rem' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={e => e.target.style.borderColor = 'var(--sage-light)'}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem',
              }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontSize: '0.7rem', color: '#d44', background: 'rgba(221,68,68,0.06)',
              padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(221,68,68,0.15)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '0.6rem', borderRadius: '12px', fontWeight: 700,
              fontSize: '0.8rem', border: 'none', cursor: loading ? 'default' : 'pointer',
              background: 'var(--primary-color)', color: '#fff',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function TopBar() {
  const { user, isReady, isGuest, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setShowMenu(false)
    await logout()
    window.location.reload()
  }

  return (
    <>
      <div className="top-bar">
        <span className="top-bar-brand">🧘 Zen</span>
        <div className="top-bar-user">
          {!isReady ? (
            <Loader2 size={12} className="animate-spin" style={{ opacity: 0.4 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {(isGuest || !user) && (
                <button
                  onClick={() => setShowAuth(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.3rem 0.65rem', borderRadius: '8px',
                    background: 'var(--primary-color)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700, border: 'none',
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                >
                  <LogIn size={12} />
                  Sign In · Sync across devices
                </button>
              )}

              {user && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', color: 'var(--text-main)',
                    }}
                  >
                    <div style={{
                      width: '1.4rem', height: '1.4rem', borderRadius: '50%',
                      background: 'var(--primary-color)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700,
                    }}>
                      {(user.name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <strong>{user.name || user.email}</strong>
                  </button>

                  {showMenu && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem',
                      background: '#fff', borderRadius: '10px', padding: '0.25rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid var(--sage-light)',
                      minWidth: '120px', zIndex: 100,
                    }}>
                      <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
                        padding: '0.45rem 0.65rem', borderRadius: '8px', background: 'none',
                        border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                        color: '#d44', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(221,68,68,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="zen-gradient-bg">
          <div className="app-shell">
            <TopBar />
            <div className="page-container">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/check-in" element={<CheckIn />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route path="/explore" element={<Explore />} />
                </Routes>
              </AnimatePresence>
            </div>
          </div>

          <nav className="nav-bar">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Daily</span>
            </NavLink>
            <NavLink to="/check-in" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CheckCircle2 size={20} />
              <span>Check-In</span>
            </NavLink>
            <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Target size={20} />
              <span>Goals</span>
            </NavLink>
            <NavLink to="/trends" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BarChart3 size={20} />
              <span>Trends</span>
            </NavLink>
            <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Compass size={20} />
              <span>Explore</span>
            </NavLink>
          </nav>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
