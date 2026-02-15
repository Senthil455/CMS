import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckCircle2, Target, BarChart3 } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Goals from './pages/Goals'
import Trends from './pages/Trends'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="zen-gradient-bg">
        <div className="page-container">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/trends" element={<Trends />} />
            </Routes>
          </AnimatePresence>
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
        </nav>
      </div>
    </BrowserRouter>
  )
}

export default App
