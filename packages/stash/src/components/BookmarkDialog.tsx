import React, { useState, useEffect } from 'react';
import { BookmarkFolder, engagementApi } from '../utils/engagementApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Bookmark, FolderOpen, X, ChevronRight, FolderPlus } from 'lucide-react';

interface BookmarkDialogProps {
  isOpen: boolean;
  entityName: string;
  recordId: string;
  onClose: () => void;
  onSaved: () => void;
}

export const BookmarkDialog: React.FC<BookmarkDialogProps> = ({
  isOpen,
  entityName,
  recordId,
  onClose,
  onSaved
}) => {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (entityName && recordId) {
        setIsLoading(true);
        engagementApi.fetchBookmarkFolders(entityName, recordId)
          .then(data => {
            setFolders(data.map(f => ({ ...f, selected: !!f.selected })));
          })
          .catch(err => console.error('Failed to load folders', err))
          .finally(() => setIsLoading(false));
      }
    } else {
      setFolders([]);
      setNewFolderName('');
    }
  }, [isOpen, entityName, recordId]);

  if (!isOpen) return null;

  const handleToggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedFolders = folders.filter(f => f.selected).map(f => f.id);
      await engagementApi.saveBookmark(entityName, recordId, {
        selectedFolders,
        newFolderName
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error('Failed to save bookmark', e);
      alert('Failed to save bookmark.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
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
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sage-medium, #c5d1ca)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--sage-light)'; }}
                aria-label="Close"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🔖</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sage-dark)', margin: 0 }}>
                Save to Folder
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Choose where to store this item
              </p>
            </div>

            {/* Folders Section */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Folders
              </label>

              {isLoading ? (
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
                  <span>Loading folders…</span>
                </div>
              ) : folders.length === 0 ? (
                <div style={{
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  border: '1px solid var(--sage-light)',
                }}>
                  No folders yet. Create one below.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 180, overflowY: 'auto' }}>
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => handleToggleFolder(folder.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.65rem',
                        background: folder.selected ? 'rgba(107,142,120,0.1)' : 'rgba(255,255,255,0.6)',
                        border: folder.selected ? '1px solid var(--sage-dark)' : '1px solid var(--sage-light)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FolderOpen size={15} strokeWidth={1.8} style={{ color: folder.selected ? 'var(--sage-dark)' : 'var(--text-muted)' }} />
                        <span style={{
                          color: folder.selected ? 'var(--sage-dark)' : 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}>
                          {folder.name || 'Default Folder'}
                        </span>
                      </div>
                      <ChevronRight size={13} strokeWidth={2.5} style={{ color: folder.selected ? 'var(--sage-dark)' : 'var(--text-muted)' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Folder Section */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Create New Folder
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Name your new folder..."
                  style={{ ...inputStyle, paddingLeft: '2rem' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--sage-light)'}
                />
                <FolderPlus
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button
                onClick={onClose}
                disabled={isSaving}
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
                onClick={handleSave}
                disabled={isSaving || isLoading}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: isSaving || isLoading ? 'default' : 'pointer',
                  background: 'var(--sage-dark)',
                  color: '#fff',
                  opacity: isSaving || isLoading ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontFamily: 'inherit',
                }}
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
