import React, { useState } from 'react';
import { useUserInfo, logout, setAuthApiBaseUrl, setActivityBaseUrl } from "@cms/sdk";
import { LogIn, LogOut, Loader2, User, ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { data: userInfo, isLoading } = useUserInfo();
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
    <div className="flex justify-between items-center py-2.5 px-3 mb-6 bg-white/50 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-[90]">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xl shrink-0">🧘</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/explore" className="font-outfit font-extrabold text-xl text-sage-dark tracking-tight hover:opacity-80 transition-opacity shrink-0 no-underline">
            Zen Stash
          </Link>
          {pageTitle && (
            <>
              <span className="text-sage-medium/50 text-lg font-light shrink-0">/</span>
              <span className="font-outfit font-bold text-lg text-sage-dark/80 tracking-tight truncate">
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
              className="flex items-center gap-1 p-1 bg-white hover:bg-white/80 border border-gray-200 shadow-sm rounded-full transition-all duration-300 hover:shadow-md"
            >
              <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center text-sage-dark transition-colors group-hover:bg-sage-medium">
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
                    className="absolute right-0 mt-2 w-56 py-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-zen z-[100]"
                  >
                    <button 
                      onClick={() => { setShowAbout(true); setShowMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-sage-light/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3 text-sage-dark text-[0.85rem] font-bold">
                        <Info size={16} className="text-sage-medium group-hover:text-sage-dark transition-colors" />
                        <span>About</span>
                      </div>
                    </button>
                    <div className="mx-2 my-1 border-b border-gray-100" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 text-[0.85rem] font-bold transition-colors"
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

      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm relative"
            >
              <h2 className="text-2xl font-extrabold text-sage-dark mb-4 tracking-tight flex items-center gap-2">
                <span className="text-3xl">🧘</span> Zen Stash
              </h2>
              <div className="space-y-4 mb-8">
                <div className="bg-sage-light/30 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">Build Version</p>
                  {/* @ts-ignore */}
                  <p className="text-sm font-bold text-sage-dark">{typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Development Mode'}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAbout(false)}
                className="w-full py-3 bg-sage-medium hover:bg-sage-dark text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-sage-medium/30 active:scale-[0.98]"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
