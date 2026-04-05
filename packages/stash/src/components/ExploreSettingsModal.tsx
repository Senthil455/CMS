import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, Check } from 'lucide-react';
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

  const allOptions: Array<{ id: string; label: string; description?: string }> = [
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

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 font-outfit"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{
              width: '100%',
              maxWidth: '340px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem', position: 'relative' }}>
              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '-0.25rem',
                  right: '-0.25rem',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--sage-light)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--sage-medium, #c5d1ca)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--sage-light)'; }}
                aria-label="Close"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🗂️</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
                Explore Settings
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Choose tabs to display
              </p>
            </div>

            {/* Tabs Section */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Available Tabs
              </label>

              {queryLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem 0',
                  gap: '0.4rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading available queries…</span>
                </div>
              ) : queryError ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem',
                  background: 'rgba(239,68,68,0.08)',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <AlertCircle size={14} />
                  Failed to load public queries.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 220, overflowY: 'auto' }}>
                  {allOptions.map(option => {
                    const isSelected = settings.selectedTabs.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleTab(option.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.65rem',
                          background: isSelected ? 'rgba(107,142,120,0.1)' : 'rgba(255,255,255,0.6)',
                          border: isSelected ? '1px solid var(--sage-dark)' : '1px solid var(--sage-light)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{
                            color: isSelected ? 'var(--sage-dark)' : 'var(--text-main)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}>
                            {option.label}
                          </span>
                          {option.description && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {option.description}
                            </span>
                          )}
                        </div>
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '5px',
                          border: isSelected ? '2px solid var(--sage-dark)' : '2px solid var(--sage-light)',
                          background: isSelected ? 'var(--sage-dark)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s',
                        }}>
                          {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer note */}
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0 0.75rem' }}>
              {settings.selectedTabs.length === 0
                ? 'Select at least one tab to show on Explore'
                : `${settings.selectedTabs.length} tab${settings.selectedTabs.length > 1 ? 's' : ''} selected`}
            </p>

            {/* Done button */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--sage-dark)',
                color: '#fff',
                transition: 'opacity 0.2s',
                fontFamily: 'inherit',
              }}
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  , document.body);
};
