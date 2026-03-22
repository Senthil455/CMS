import React, { useState } from 'react';
import { useUserInfo, logout, setAuthApiBaseUrl, setActivityBaseUrl } from "@cms/sdk";
import { LogIn, LogOut, Loader2, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { data: userInfo, isLoading } = useUserInfo();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/stash/login';
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/explore')) return 'Explore';
    if (path.includes('/bookmarks')) return 'Bookmarks';
    if (path.includes('/assets')) return 'Assets';
    if (path.includes('/offline')) return 'Offline';
    return '';
  };

  const pageTitle = getPageTitle();

  return (
    <div className="flex justify-between items-center py-4 px-2 mb-6 border-b border-glass-border">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xl shrink-0">🧘</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/explore" className="font-outfit font-extrabold text-2xl text-sage-dark tracking-tight hover:opacity-80 transition-opacity shrink-0 no-underline">
            Zen Stash
          </Link>
          {pageTitle && (
            <>
              <span className="text-sage-medium/50 text-xl font-light shrink-0">/</span>
              <span className="font-outfit font-bold text-xl text-sage-dark/80 tracking-tight truncate">
                {pageTitle}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-sage-medium" />
        ) : userInfo ? (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1.5 p-1 bg-white/40 hover:bg-white/60 border border-glass-border rounded-full transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center text-sage-dark transition-colors group-hover:bg-sage-medium">
                <User size={18} />
              </div>
              <ChevronDown size={14} className={`mr-1 text-sage-medium transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90]"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 py-2 bg-white/95 backdrop-blur-xl border border-glass-border rounded-2xl shadow-zen z-[100]"
                  >
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 text-[0.85rem] font-bold transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-2 py-2 px-4 bg-primary-color hover:bg-sage-dark text-white rounded-2xl text-[0.85rem] font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:translate-y-[-1px]"
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
};
