import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Bookmark, HardDrive, WifiOff } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isExplore = location.pathname.includes('/explore');
  const isBookmarks = location.pathname.includes('/bookmarks');
  const isAssets = location.pathname.includes('/assets');
  const isOffline = location.pathname.includes('/offline');

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px] justify-between flex gap-1 px-3 py-2 sm:px-5 sm:py-2.5 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-full shadow-lg">
      <NavLink 
        to="/explore" 
        className={({ isActive }) => `flex flex-col flex-1 items-center gap-1 text-[0.60rem] sm:text-[0.65rem] font-semibold px-1 py-1.5 sm:px-3 text-center leading-tight rounded-full transition-all duration-300 ${isActive ? 'text-sage-dark bg-sage-light' : 'text-gray-400 hover:text-sage-medium'}`}
      >
        <Compass size={24} fill={isExplore ? "currentColor" : "none"} strokeWidth={isExplore ? 2 : 1.5} />
        <span>Explore</span>
      </NavLink>
      <NavLink 
        to="/bookmarks" 
        className={({ isActive }) => `flex flex-col flex-1 items-center gap-1 text-[0.60rem] sm:text-[0.65rem] font-semibold px-1 py-1.5 sm:px-3 text-center leading-tight rounded-full transition-all duration-300 ${isActive ? 'text-sage-dark bg-sage-light' : 'text-gray-400 hover:text-sage-medium'}`}
      >
        <Bookmark size={24} fill={isBookmarks ? "currentColor" : "none"} strokeWidth={isBookmarks ? 2 : 1.5} />
        <span>Bookmarks</span>
      </NavLink>
      <NavLink 
        to="/assets" 
        className={({ isActive }) => `flex flex-col flex-1 items-center gap-1 text-[0.60rem] sm:text-[0.65rem] font-semibold px-1 py-1.5 sm:px-3 text-center leading-tight rounded-full transition-all duration-300 ${isActive ? 'text-sage-dark bg-sage-light' : 'text-gray-400 hover:text-sage-medium'}`}
      >
        <HardDrive size={24} fill={isAssets ? "currentColor" : "none"} strokeWidth={isAssets ? 2 : 1.5} />
        <span>Assets</span>
      </NavLink>
      <NavLink 
        to="/offline" 
        className={({ isActive }) => `flex flex-col flex-1 items-center gap-1 text-[0.60rem] sm:text-[0.65rem] font-semibold px-1 py-1.5 sm:px-3 text-center leading-tight rounded-full transition-all duration-300 ${isActive ? 'text-sage-dark bg-sage-light' : 'text-gray-400 hover:text-sage-medium'}`}
      >
        <WifiOff size={24} strokeWidth={isOffline ? 2.5 : 1.5} />
        <span>Offline</span>
      </NavLink>
    </nav>
  )
}
