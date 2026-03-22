import React, { useEffect, useState } from 'react';
import { BookmarkItem, BookmarkFolder } from '@/types';
import { getAllBookmarks, getAllBookmarkFolders, saveBookmarks, clearBookmarks } from '@/utils/storage';
import { useOnlineStatus } from '@/hooks';
import { syncBookmarksStore } from '@/components/SyncManager';

const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const handleSpeak = (content: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const doc = new DOMParser().parseFromString(content, 'text/html');
      const textContent = doc.body.textContent || "";
      const utterance = new SpeechSynthesisUtterance(textContent);
      window.speechSynthesis.speak(utterance);
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

  // Filter bookmarks locally since we sync all of them, or if specific folder is selected
  // Wait, if API returns specific folders, does our locally saved 'all' bookmarks contain folder info?
  // The API payload for bookmark list returned by user:
  // { "id": 1, "updatedAt": "...", "image": "...", "title": "...", "url": "..." }
  // There is NO folderId in the BookmarkItem! 
  // If there's no folderId, filtering strictly locally is currently not feasible unless we store the folder mapping.
  // For now, if a folder is selected, we must fetch from the API if online, or show an indicator that offline filtering isn't supported.

  // To avoid complexity right now, we will just show everything if no folder is selected. 
  // If a folder IS selected, we just render what `bookmarks` state has (which gets updated by the `refreshRemote` above).

  return (
    <div className="flex flex-col gap-6 font-inter pb-20">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-extrabold text-sage-dark tracking-tight">Your Bookmarks</h1>
        {!isOnline && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold shadow-sm border border-amber-100 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Offline
          </span>
        )}
      </div>

      {folders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedFolder === folder.id
                  ? 'bg-sage-dark text-white border-transparent shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sage-medium hover:text-sage-dark'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarks.filter(b => b.folderId === selectedFolder).map(item => (
            <a
              key={item.id}
              href={item.url}
              className="flex flex-col gap-3 p-4 bg-glass backdrop-blur-zen border border-glass-border rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group no-underline"
            >
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-white/50 border border-white/20">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 px-1 mt-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[0.95rem] font-bold text-sage-dark leading-tight line-clamp-2">{item.title}</h3>
                  {item.content && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSpeak(item.content!);
                      }}
                      className="p-1.5 shrink-0 bg-sage-light/30 hover:bg-sage-light/60 text-sage-dark rounded-full transition-colors"
                      aria-label="Play text-to-speech"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-[0.8rem] text-text-muted line-clamp-2 leading-relaxed">{item.subtitle}</p>
                <p className="text-[0.65rem] text-text-muted mt-2 font-bold uppercase tracking-wider">
                  {new Date(item.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
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
  );
};

export default BookmarksPage;
