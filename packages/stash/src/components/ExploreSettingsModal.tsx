import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutList, Loader2, AlertCircle, Check } from 'lucide-react';
import useSWR from 'swr';
import { useExploreSettings } from '../hooks/useExploreSettings';

interface ExploreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
}

const BUILT_IN_TABS = [
  { id: 'topList', label: 'Top List', description: 'Trending & top-ranked content' },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const ExploreSettingsModal: React.FC<ExploreSettingsModalProps> = ({
  isOpen,
  onClose,
  apiBaseUrl,
}) => {
  const { settings, toggleTab } = useExploreSettings();

  const { data: publicQueries, error: queryError, isLoading: queryLoading } = useSWR<string[]>(
    isOpen ? `${apiBaseUrl}/api/schemas/public-queries` : null,
    fetcher
  );

  const allOptions: Array<{ id: string; label: string; description?: string; isBuiltIn?: boolean }> = [
    ...BUILT_IN_TABS,
    ...(publicQueries ?? []).map(q => ({
      id: q,
      label: q
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim(),
      description: `Query: ${q}`,
    })),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[99999] p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sage-light/50 flex items-center justify-center text-sage-dark">
                  <LayoutList size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-sage-dark tracking-tight">Explore Settings</h2>
                  <p className="text-[0.72rem] text-text-muted font-medium">Choose tabs to display</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              {queryLoading ? (
                <div className="flex items-center justify-center py-10 gap-3 text-sage-medium">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm font-semibold">Loading available queries…</span>
                </div>
              ) : queryError ? (
                <div className="flex items-center gap-2 py-4 px-4 bg-red-50 rounded-2xl text-red-600 text-sm font-medium">
                  <AlertCircle size={16} />
                  Failed to load public queries.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {allOptions.map(option => {
                    const isSelected = settings.selectedTabs.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleTab(option.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 text-left ${
                          isSelected
                            ? 'bg-sage-light/30 border-sage-medium/40 shadow-sm'
                            : 'bg-gray-50/80 border-gray-100 hover:bg-gray-100/80'
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                            isSelected
                              ? 'bg-sage-dark border-sage-dark'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[0.875rem] font-bold leading-tight ${isSelected ? 'text-sage-dark' : 'text-gray-600'}`}>
                            {option.label}
                          </p>
                          {option.description && (
                            <p className="text-[0.7rem] text-text-muted mt-0.5">{option.description}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[0.72rem] text-text-muted text-center">
                {settings.selectedTabs.length === 0
                  ? 'Select at least one tab to show on Explore'
                  : `${settings.selectedTabs.length} tab${settings.selectedTabs.length > 1 ? 's' : ''} selected`}
              </p>
              <button
                onClick={onClose}
                className="mt-3 w-full py-2.5 bg-sage-medium hover:bg-sage-dark text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-sage-medium/20 active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
