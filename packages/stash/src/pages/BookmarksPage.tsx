import React, { useEffect, useState } from 'react';
import { BookmarkItem, BookmarkFolder } from '@/types';
import { getAllBookmarks, getAllBookmarkFolders, saveBookmarks, clearBookmarks } from '@/utils/storage';
import { useOnlineStatus } from '@/hooks';
import { syncBookmarksStore } from '@/components/SyncManager';
import { useTTS } from '@/contexts/TTSContext';
import { BookmarkDialog } from '../components/BookmarkDialog';
import { engagementApi } from '../utils/engagementApi';

const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkTarget, setBookmarkTarget] = useState<{ entityName: string, recordId: string } | null>(null);

  const tts = useTTS();

  const handleSpeak = (item: BookmarkItem, index: number) => {
    tts.setCurrentTitle(item.title);
    
    // Register playlist for navigation (filtered by current folder)
    const filteredBookmarks = bookmarks.filter(b => b.folderId === selectedFolder);
    tts.setPlaylist(filteredBookmarks, index, (newItem) => 
      handleSpeak(newItem, filteredBookmarks.findIndex(b => b.id === newItem.id))
    );

    tts.setTranscriptOpen(true);
    tts.play(item.content || "", `${item.entityName}_${item.recordId}`);
  };

  const handleDelete = async (item: BookmarkItem) => {
    if (!window.confirm(`Remove "${item.title}" from bookmarks?`)) return;
    try {
      await engagementApi.deleteBookmark(item.id);
      if (isOnline) {
        await syncBookmarksStore();
      }
      await loadLocalData();
    } catch (e) {
      console.error('Failed to delete bookmark', e);
      alert('Failed to delete bookmark.');
    }
  };

  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useOnlineStatus();

  // Load from offline storage (IndexedDB)
  const loadLocalData = async () => {
    try {
      const dbBookmarks = await getAllBookmarks();
      const dbFolders = await getAllBookmarkFolders();
      setBookmarks(dbBookmarks);
      setFolders(dbFolders);
    } catch (e) {
      console.error('Failed to load local bookmarks', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocalData();

    // If online, do a quick foreground refresh for this specific page
    if (isOnline) {
      const refreshRemote = async () => {
        try {
          await syncBookmarksStore();
          await loadLocalData();
        } catch (e) {
          console.warn('Foreground bookmark sync failed:', e);
        }
      };
      refreshRemote();
    }
  }, [isOnline]);


  return (
    <div className="flex flex-col gap-6 pb-24">
      <hr className="border-t border-gray-200/80 -mt-2 mb-0 mx-2" />

      <div className="flex flex-col gap-6 mt-1">
        {!isOnline && (
          <div className="px-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold shadow-sm border border-amber-100 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Offline
            </span>
          </div>
        )}

      {folders.length > 0 && (
        <div className="flex gap-2 p-1 bg-sage-light/50 rounded-2xl w-fit sticky top-0 z-10 backdrop-blur-md overflow-x-auto scrollbar-hide mx-1 mb-2">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-[0.75rem] font-bold transition-all duration-300 ${
                selectedFolder === folder.id 
                  ? 'bg-white text-sage-dark shadow-sm' 
                  : 'text-text-muted hover:text-sage-dark'
              }`}
            >
              {folder.name || 'Default'}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin text-sage-medium">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>
      ) : bookmarks.filter(b => b.folderId === selectedFolder).length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {bookmarks.filter(b => b.folderId === selectedFolder).map((item, index) => (
            <a
              key={item.id}
              href={item.url}
              onClick={(e) => {
                e.preventDefault();
                handleSpeak(item, index);
              }}
              className="flex items-center gap-4 p-3.5 bg-white/80 hover:bg-white rounded-2xl border border-gray-100/60 hover:border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-250 group no-underline cursor-pointer"
            >
              {/* Image with play overlay */}
              <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-sage-light/20 relative">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                  <svg
                    width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"
                    className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 drop-shadow-lg"
                  >
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[0.9rem] font-bold text-sage-dark leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors duration-200">
                  {item.title}
                </h3>
                <p className="text-[0.75rem] text-text-muted line-clamp-1 mb-1.5 font-medium">
                  {item.subtitle}
                </p>
                <p className="text-[0.62rem] text-gray-400 font-bold uppercase tracking-wider">
                  {new Date(item.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove Bookmark"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="p-12 border-2 border-dashed border-sage-medium/50 rounded-3xl flex flex-col items-center justify-center bg-glass backdrop-blur-zen shadow-sm text-center">
          <div className="w-16 h-16 bg-sage-light/30 rounded-full flex items-center justify-center mb-4 text-sage-medium">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <p className="text-gray-900 font-bold text-lg">No bookmarks found</p>
          <p className="text-gray-500 font-medium text-sm mt-1 max-w-[250px]">
            {selectedFolder ? "This folder is currently empty." : "Your saved content will appear here when you bookmark items from the Explore page."}
          </p>
        </div>
      )}
      </div>

      {bookmarkTarget && (
        <BookmarkDialog
          isOpen={true}
          entityName={bookmarkTarget.entityName}
          recordId={bookmarkTarget.recordId}
          onClose={() => setBookmarkTarget(null)}
          onSaved={() => {
            setBookmarkTarget(null);
            loadLocalData(); // Refresh to show any changes (though folders are remote, this is good practice)
          }}
        />
      )}
    </div>
  );
};

export default BookmarksPage;
