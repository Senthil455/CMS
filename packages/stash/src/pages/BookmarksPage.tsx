import React, { useEffect, useState } from 'react';
import { BookmarkItem, BookmarkFolder } from '@/types';
import { getAllBookmarks, getAllBookmarkFolders, saveBookmarks, clearBookmarks } from '@/utils/storage';
import { useOnlineStatus } from '@/hooks';
import { syncBookmarksStore } from '@/components/SyncManager';
import { useTTS } from '@/contexts/TTSContext';

const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const tts = useTTS();

  const handleSpeak = (item: BookmarkItem) => {
    tts.setCurrentTitle(item.title);
    tts.play(item.content || "", `${item.entityName}_${item.recordId}`);
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
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-[0.62rem] font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedFolder === folder.id 
                  ? 'bg-white text-sage-dark shadow-sm' 
                  : 'text-sage-medium hover:text-sage-dark hover:bg-white/50'
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
        <div className="grid grid-cols-1 gap-[1px] bg-gray-200/40 rounded-2xl overflow-hidden border border-gray-200/40 shadow-sm">
          {bookmarks.filter(b => b.folderId === selectedFolder).map(item => (
            <a
              key={item.id}
              href={item.url}
              className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/95 transition-all duration-200 group no-underline cursor-pointer"
            >
              {/* Image */}
              <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-sage-light/20">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-sage-dark leading-tight line-clamp-2 mb-1">
                  {item.title}
                </h3>
                <p className="text-[0.7rem] text-text-muted line-clamp-1 mb-2">
                  {item.subtitle}
                </p>
                <p className="text-[0.62rem] text-gray-400 font-bold uppercase tracking-wider">
                  {new Date(item.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {item.content && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSpeak(item);
                    }}
                    className="w-9 h-9 bg-sage-dark text-white rounded-full flex items-center justify-center shadow-md shadow-sage-dark/20 active:scale-90 transition-transform"
                    aria-label="Play text-to-speech"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                )}
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
    </div>
  );
};

export default BookmarksPage;
