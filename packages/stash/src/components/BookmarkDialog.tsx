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
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
      style={{
        background: visible ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0)',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden font-inter"
        style={{
          background: '#F8FAFC',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="pt-[28px] px-8 pb-8">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-[1.5rem] font-bold text-[#1E293B] tracking-tight">
              Save to Folder
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 -mr-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-[0.93rem] text-[#64748B] font-medium">
            Choose where to store this item
          </p>
        </div>

        <div className="px-8 space-y-8">
          {/* Folders Section */}
          <div className="space-y-[18px]">
            <label className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-[0.14em]">
              Your Folders
            </label>
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="animate-spin text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 font-medium tracking-wide">Fetching folders...</span>
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto pr-1 -mr-1 custom-scrollbar space-y-2">
                {folders.length === 0 ? (
                  <div className="py-8 bg-slate-50 border border-dashed border-slate-200 rounded-[14px] flex flex-col items-center justify-center text-slate-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-xs font-semibold">No folders found</span>
                  </div>
                ) : (
                  folders.map(folder => (
                    <label
                      key={folder.id}
                      className="group flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-primary/30 hover:shadow-sm rounded-[14px] cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full transition-all duration-300 ${folder.selected ? 'bg-primary' : 'bg-transparent'}`} />
                        <span className="text-[0.95rem] font-semibold text-slate-700">{folder.name || 'Default Folder'}</span>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={folder.selected}
                          onChange={() => handleToggleFolder(folder.id)}
                          className="peer sr-only"
                        />
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-200 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition-all duration-200">
                          <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="space-y-[18px]">
            <label className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-[0.14em]">
              Create New Folder
            </label>
            <div className="relative group">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Name your new folder..."
                className="w-full px-4 py-4 bg-white border border-slate-200 rounded-[14px] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 mt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-600 font-bold rounded-[14px] transition-all disabled:opacity-50 text-[0.93rem]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-1 py-4 bg-primary hover:bg-[#5a8c66] active:scale-[0.98] text-white font-bold rounded-[14px] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-[0.93rem]"
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Saving...</span>
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
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
};
