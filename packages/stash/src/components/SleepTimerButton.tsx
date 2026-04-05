import React, { useState } from 'react';
import { Moon, Timer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSleepTimer } from '../contexts/SleepTimerContext';

const SLEEP_OPTIONS = [
  { label: '2 min', seconds: 2 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
];

const formatSleepTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
};

export const SleepTimerButton: React.FC = () => {
  const sleepTimer = useSleepTimer();
  const [showMenu, setShowMenu] = useState(false);
  const isActive = sleepTimer.remaining !== null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${isActive
          ? 'bg-sage-dark text-white shadow-md'
          : 'bg-sage-light/40 text-sage-dark hover:bg-sage-light/70'
          }`}
        aria-label="Sleep Timer"
      >
        <Moon size={14} />
        {isActive && <span>{formatSleepTime(sleepTimer.remaining!)}</span>}
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90]"
              onClick={() => setShowMenu(false)}
            />

            {/* Dropdown — same style as avatar menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute right-0 mt-3 w-56 pt-4 pb-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl z-[100] overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-medium to-sage-dark flex items-center justify-center text-white shadow-inner shrink-0">
                  <Timer size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-sage-medium/70 uppercase tracking-wider">Sleep Timer</span>
                  <span className="text-sm font-bold text-sage-dark truncate">
                    {isActive ? `${formatSleepTime(sleepTimer.remaining!)} left` : 'Stop after…'}
                  </span>
                </div>
              </div>

              <div className="mx-3 my-2 border-b border-gray-100" />

              {/* Options */}
              <div className="px-2 space-y-1">
                {SLEEP_OPTIONS.map(opt => (
                  <button
                    key={opt.seconds}
                    onClick={() => { sleepTimer.start(opt.seconds); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sage-light/40 rounded-xl transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-sage-light/50 flex items-center justify-center text-sage-dark group-hover:bg-white transition-colors shrink-0">
                      <Moon size={14} />
                    </div>
                    <span className="text-[0.85rem] font-bold text-sage-dark">{opt.label}</span>
                  </button>
                ))}

                {isActive && (
                  <>
                    <div className="mx-1 my-1 border-b border-gray-100" />
                    <button
                      onClick={() => { sleepTimer.cancel(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white group-hover:text-red-600 transition-colors shrink-0">
                        <X size={14} />
                      </div>
                      <span className="text-[0.85rem] font-bold text-red-500 group-hover:text-red-600">Cancel timer</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
