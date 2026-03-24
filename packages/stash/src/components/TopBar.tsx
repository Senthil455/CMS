import React, { useState, useRef, useEffect } from 'react';
import { useUserInfo, logout, setAuthApiBaseUrl, setActivityBaseUrl } from "@cms/sdk";
import { LogIn, LogOut, Loader2, User, ChevronDown, Info, Moon, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from 'react-router-dom';
import { useTTS } from '../contexts/TTSContext';

const SLEEP_OPTIONS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
];

export const TopBar: React.FC = () => {
  const { data: userInfo, isLoading } = useUserInfo();
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const location = useLocation();
  const tts = useTTS();

  // Sleep timer
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSleepTimer = () => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    setSleepRemaining(null);
  };

  const startSleepTimer = (seconds: number) => {
    clearSleepTimer();
    setSleepRemaining(seconds);
    setShowSleepMenu(false);
    sleepIntervalRef.current = setInterval(() => {
      setSleepRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Stop TTS
          tts.stop();
          // Stop offline video player via custom event
          window.dispatchEvent(new CustomEvent('stash:stopAll'));
          clearInterval(sleepIntervalRef.current!);
          sleepIntervalRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => () => clearSleepTimer(), []);

  const formatSleepTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

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
    <div className="flex justify-between items-center py-2.5 px-3 mb-4 sticky top-0 z-[90] bg-transparent">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xl shrink-0">🧘</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/explore" className="font-outfit font-extrabold text-xl text-sage-dark tracking-tight hover:opacity-80 transition-opacity shrink-0 no-underline">
            Zen
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

      <div className="flex items-center gap-2">
        {/* Sleep Timer */}
        <div className="relative">
          <button
            onClick={() => setShowSleepMenu(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              sleepRemaining !== null
                ? 'bg-sage-dark text-white shadow-md'
                : 'bg-sage-light/40 text-sage-dark hover:bg-sage-light/70'
            }`}
            aria-label="Sleep Timer"
          >
            <Moon size={14} />
            {sleepRemaining !== null && (
              <span>{formatSleepTime(sleepRemaining)}</span>
            )}
          </button>

          <AnimatePresence>
            {showSleepMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[91]"
                  onClick={() => setShowSleepMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 bg-white border border-sage-light/50 shadow-xl rounded-2xl p-3 z-[92] flex flex-col gap-1 min-w-[160px]"
                >
                  <p className="text-[0.62rem] font-extrabold uppercase tracking-widest text-text-muted px-1 pb-1 flex items-center gap-1">
                    <Timer size={10} /> Stop after
                  </p>
                  {SLEEP_OPTIONS.map(opt => (
                    <button
                      key={opt.seconds}
                      onClick={() => startSleepTimer(opt.seconds)}
                      className="text-sm font-bold text-sage-dark text-left px-3 py-2 rounded-xl hover:bg-sage-light/40 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                  {sleepRemaining !== null && (
                    <>
                      <div className="w-full h-px bg-sage-light/40 my-1" />
                      <button
                        onClick={() => { clearSleepTimer(); setShowSleepMenu(false); }}
                        className="text-sm font-bold text-red-500 text-left px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Cancel timer
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-sage-medium" />
        ) : userInfo ? (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-full transition-all duration-300 hover:shadow-md hover:bg-white group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-medium to-sage-dark flex items-center justify-center text-white shadow-inner font-bold text-sm">
                {userInfo?.email ? userInfo.email.charAt(0).toUpperCase() : <User size={16} />}
              </div>
              <span className="text-sm font-semibold text-sage-dark max-w-[100px] sm:max-w-[150px] truncate">
                {userInfo?.email ? userInfo.email.split('@')[0] : 'User'}
              </span>
              <ChevronDown size={14} className={`text-sage-medium/70 transition-transform duration-300 group-hover:text-sage-dark ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[90]"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute right-0 mt-3 w-64 pt-4 pb-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl z-[100] overflow-hidden"
                  >
                    <div className="px-5 mb-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-medium to-sage-dark flex items-center justify-center text-white shadow-inner font-bold text-lg shrink-0">
                        {userInfo?.email ? userInfo.email.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-sage-medium/70 uppercase tracking-wider">Signed in as</span>
                        <span className="text-sm font-bold text-sage-dark truncate">
                          {userInfo?.email ? userInfo.email.split('@')[0] : 'User'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mx-3 my-2 border-b border-gray-100" />
                    
                    <div className="px-2 space-y-1">
                      <button 
                        onClick={() => { setShowAbout(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sage-light/40 rounded-xl transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-sage-light/50 flex items-center justify-center text-sage-dark group-hover:bg-white transition-colors">
                          <Info size={16} />
                        </div>
                        <span className="text-[0.85rem] font-bold text-sage-dark">About Zen Stash</span>
                      </button>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white group-hover:text-red-600 transition-colors">
                          <LogOut size={16} />
                        </div>
                        <span className="text-[0.85rem] font-bold text-red-500 group-hover:text-red-600">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-2 py-2 px-4 bg-primary hover:bg-sage-dark text-white rounded-2xl text-[0.85rem] font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:translate-y-[-1px]"
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
