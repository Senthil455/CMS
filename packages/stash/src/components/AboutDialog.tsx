import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
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

              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🧘</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
                Zen Stash
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Your mindful reading companion
              </p>
            </div>

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.1rem' }}>
              <div style={{
                padding: '0.55rem 0.65rem',
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid var(--sage-light)',
                borderRadius: '10px',
              }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.2rem' }}>
                  Build Version
                </p>
                {/* @ts-ignore */}
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sage-dark)', margin: 0 }}>
                  {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Development Mode'}
                </p>
              </div>
            </div>

            {/* Close button */}
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
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  , document.body);
};
