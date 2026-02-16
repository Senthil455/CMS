import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckCircle2, Target, BarChart3, Compass, Loader2 } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Goals from './pages/Goals'
import Trends from './pages/Trends'
import Explore from './pages/Explore'
import './index.css'

function TopBar() {
  const { user, isReady } = useAuth();

  return (
    <div className="top-bar">
      <span className="top-bar-brand">🧘 Zen</span>
      <div className="top-bar-user">
        {!isReady ? (
          <Loader2 size={12} className="animate-spin" style={{ opacity: 0.4 }} />
        ) : user ? (
          <span>Welcome, <strong>{user.name || user.email || 'Guest'}</strong></span>
        ) : (
          <span style={{ opacity: 0.4 }}>Not connected</span>
        )}
      </div>
    </div>
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
