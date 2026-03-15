import React, { useState } from 'react';
import { useUserInfo, logout, setAuthApiBaseUrl, setActivityBaseUrl } from "@cms/sdk";
import { LogIn, LogOut, Loader2, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { data: userInfo, isLoading } = useUserInfo();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/stash/login';
  };


  return (
    <div className="flex justify-between items-center py-4 px-2 mb-6 border-b border-glass-border">
      <div className="flex items-center gap-2">
        <span className="text-xl">🧘</span>
        <span className="font-outfit font-extrabold text-xl text-sage-dark tracking-tight">Zen Stash</span>
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-sage-medium" />
        ) : userInfo ? (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 py-1.5 px-3 bg-white/40 hover:bg-white/60 border border-glass-border rounded-2xl transition-all duration-300"
            >
              <div className="w-6 h-6 rounded-full bg-primary-color flex items-center justify-center text-white text-[0.65rem] font-bold">
                {userInfo.email?.[0].toUpperCase()}
              </div>
              <span className="text-[0.85rem] font-bold text-sage-dark max-w-[120px] truncate">
                {userInfo.email}
              </span>
              <ChevronDown size={14} className={`text-sage-medium transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
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
