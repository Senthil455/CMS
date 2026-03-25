import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Link, Loader2 } from "lucide-react";

interface AddAssetDialogProps {
  show: boolean;
  videoUrl: string;
  isDownloading: boolean;
  downloadError: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AddAssetDialog: React.FC<AddAssetDialogProps> = ({
  show,
  videoUrl,
  isDownloading,
  downloadError,
  onUrlChange,
  onSubmit,
  onClose
}) => {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    paddingLeft: '2rem',
    borderRadius: '10px',
    border: '1px solid var(--sage-light)',
    background: 'rgba(255,255,255,0.6)',
    fontSize: '0.8rem',
    fontFamily: 'inherit',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 font-outfit"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => !isDownloading && onClose()}
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
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sage-medium, #c5d1ca)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--sage-light)'; }}
                aria-label="Close"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📎</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
                Add New Asset
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Paste a link to any media file
              </p>
            </div>

            {/* URL Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Asset URL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://example.com/asset-url"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--sage-light)'}
                    disabled={isDownloading}
                  />
                  <Link
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {downloadError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      fontSize: '0.7rem',
                      color: '#d44',
                      background: 'rgba(221,68,68,0.06)',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(221,68,68,0.15)',
                    }}
                  >
                    {downloadError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  onClick={onClose}
                  disabled={isDownloading}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: '1px solid var(--sage-light)',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={!videoUrl || isDownloading}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: !videoUrl || isDownloading ? 'default' : 'pointer',
                    background: 'var(--sage-dark)',
                    color: '#fff',
                    opacity: !videoUrl || isDownloading ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontFamily: 'inherit',
                  }}
                >
                  {isDownloading && <Loader2 size={14} className="animate-spin" />}
                  {isDownloading ? 'Processing...' : 'Add Asset'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAssetDialog;
