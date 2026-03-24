import React, { useState, useEffect } from 'react';
import { BookmarkFolder, engagementApi } from '../utils/engagementApi';

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
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
      setVisible(false);
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

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-5"
      style={{
        background: visible ? 'rgba(58, 90, 66, 0.25)' : 'rgba(58, 90, 66, 0)',
        backdropFilter: visible ? 'blur(16px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(16px)' : 'blur(0px)',
        transition: 'background 0.35s ease, backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden font-outfit"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(106, 135, 115, 0.12), 0 0 0 1px rgba(255,255,255,0.5)',
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-6 px-6 sm:px-8 pb-5">
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center text-sage-dark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-sage-dark tracking-tight">
                Save to Folder
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 -mr-1 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-sage-dark flex items-center justify-center transition-all shadow-sm"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 font-medium ml-[52px]">
            Choose where to store this item
          </p>
        </div>

        <div className="px-6 sm:px-8 space-y-6">
          {/* Folders Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-sage-dark/70 uppercase tracking-[0.14em] ml-1">
              Your Folders
            </label>
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-2.5 py-10">
                <div className="animate-spin text-primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400 font-medium tracking-wide">Fetching folders…</span>
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto pr-1 -mr-1 custom-scrollbar space-y-1.5">
                {folders.length === 0 ? (
                  <div className="py-10 bg-white/40 border border-dashed border-sage-medium/40 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-full bg-sage-light/50 flex items-center justify-center mb-3 text-sage-medium">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-sage-dark/60">No folders yet</span>
                    <span className="text-xs text-gray-400 mt-0.5">Create one below to get started</span>
                  </div>
                ) : (
                  folders.map((folder, index) => (
                    <label
                      key={folder.id}
                      className="group flex items-center justify-between p-3.5 bg-white/60 border border-white/60 hover:border-sage-medium/40 hover:bg-white/80 rounded-xl cursor-pointer transition-all duration-200"
                      style={{
                        animationDelay: `${index * 40}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-7 rounded-full transition-all duration-300 ${folder.selected ? 'bg-primary' : 'bg-sage-medium/20'}`} />
                        <span className="text-[0.92rem] font-semibold text-sage-dark">{folder.name || 'Default Folder'}</span>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={folder.selected}
                          onChange={() => handleToggleFolder(folder.id)}
                          className="peer sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          folder.selected 
                            ? 'border-primary bg-primary shadow-sm shadow-primary/20' 
                            : 'border-sage-medium/40 bg-white/80 group-hover:border-sage-medium'
                        }`}>
                          <svg 
                            className={`w-3.5 h-3.5 text-white transition-all duration-200 ${folder.selected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* New Folder Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-sage-dark/70 uppercase tracking-[0.14em] ml-1">
              Create New Folder
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sage-dark/40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Name your new folder…"
                className="w-full pl-10 pr-4 py-3.5 bg-white/60 border border-white/60 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-sage-medium/60 focus:bg-white/80 transition-all text-sm font-medium text-sage-dark placeholder:text-gray-400 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 pt-2 pb-10 sm:pb-12 mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3.5 bg-white/60 hover:bg-white/80 active:scale-[0.98] text-sage-dark font-bold rounded-xl transition-all disabled:opacity-50 text-sm border border-white/60 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-1 py-3.5 bg-sage-dark hover:bg-sage-dark/90 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-md shadow-sage-dark/15 disabled:opacity-50 text-sm"
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Saving…</span>
              </div>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--sage-medium, #c5d9cb);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--primary-color, #6da67a);
        }
      `}</style>
    </div>
  );
};
