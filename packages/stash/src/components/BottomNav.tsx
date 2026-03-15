import React from 'react'
import { NavLink } from 'react-router-dom'
import { Compass, Bookmark, HardDrive, WifiOff } from 'lucide-react'

export const BottomNav: React.FC = () => {
  return (
    <nav className="nav-bar">
      <NavLink 
        to="/explore" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Compass size={20} />
        <span>Explore</span>
      </NavLink>
      <NavLink 
        to="/bookmarks" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Bookmark size={20} />
        <span>Bookmarks</span>
      </NavLink>
      <NavLink 
        to="/assets" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <HardDrive size={20} />
        <span>Assets</span>
      </NavLink>
      <NavLink 
        to="/offline" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <WifiOff size={20} />
        <span>Offline</span>
      </NavLink>
    </nav>
  )
}
