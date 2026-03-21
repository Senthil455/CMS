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

  useEffect(() => {
    if (isOpen && entityName && recordId) {
      setIsLoading(true);
      engagementApi.fetchBookmarkFolders(entityName, recordId)
        .then(data => {
          setFolders(data.map(f => ({ ...f, selected: !!f.selected })));
        })
        .catch(err => console.error('Failed to load folders', err))
        .finally(() => setIsLoading(false));
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] backdrop-blur-sm p-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all font-inter relative overflow-hidden">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Save Bookmark</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin text-sage-medium">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Select Folders</label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {folders.map(folder => (
                  <label key={folder.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-xl cursor-pointer transition-colors shadow-sm border border-transparent hover:border-gray-200">
                    <input 
                      type="checkbox" 
                      checked={folder.selected}
                      onChange={() => handleToggleFolder(folder.id)}
                      className="w-4 h-4 text-sage-dark border-gray-300 rounded focus:ring-sage-medium"
                    />
                    <span className="text-sm text-gray-700 font-medium">{folder.name || 'Default Folder'}</span>
                  </label>
                ))}
                {folders.length === 0 && (
                  <p className="text-sm text-gray-400 italic py-2">No folders yet</p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Or Create New Folder</label>
              <input 
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name..." 
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sage-medium focus:border-sage-medium focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2 mt-4 border-t border-gray-100">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-1 py-3 bg-sage-medium hover:bg-sage-dark text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-sage-medium/30 disabled:opacity-50 active:scale-[0.98]"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
