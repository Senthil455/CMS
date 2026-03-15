import React from 'react'
import { NavLink } from 'react-router-dom'
import { Compass, Video, Music, FileText } from 'lucide-react'

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
        to="/video" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Video size={20} />
        <span>Video</span>
      </NavLink>
      <NavLink 
        to="/mp3" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Music size={20} />
        <span>MP3</span>
      </NavLink>
      <NavLink 
        to="/article" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <FileText size={20} />
        <span>Article</span>
      </NavLink>
    </nav>
  )
}
