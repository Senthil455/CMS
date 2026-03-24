import React, { useState } from 'react';
import { BookmarkDialog } from '../components/BookmarkDialog';
import { useTTS } from '../contexts/TTSContext';
import useSWR from 'swr';

interface TopListItem {
  recordId: string;
  title: string;
  url: string;
  image: string;
  subtitle: string;
  content: string;
  publishedAt: string;
  entityName: string;
}

const ExplorePage: React.FC = () => {
  const [bookmarkTarget, setBookmarkTarget] = useState<{ entityName: string, recordId: string } | null>(null);

  const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_URL ?? import.meta.env.VITE_APP_API_URL ?? '';
  const { data: topList, error: topListError, isLoading: isTopListLoading } = useSWR<TopListItem[]>(
    `${apiBaseUrl}/api/queries/topList`,
    (url: string) => fetch(url).then(res => res.json())
  );

  const tts = useTTS();

  const handleSpeak = async (item: TopListItem, index: number) => {
    const key = `${item.entityName}_${item.recordId}`;
    tts.setCurrentTitle(item.title);

    // Register playlist for navigation
    if (topList) {
      tts.setPlaylist(topList, index, (newItem) => handleSpeak(newItem, topList.indexOf(newItem)));
    }

    // Open transcript sheet immediately
    tts.setTranscriptOpen(true);

    // Start speaking immediately with teaser content to unlock iOS audio context during user gesture
    tts.play(item.content, key, true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/queries/contentTag?entityName=${item.entityName}&recordId=${item.recordId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content details');
      }
      const data = await response.json();

      let fullContent = item.content;
      if (Array.isArray(data) && data.length > 0 && data[0].content) {
        fullContent = data[0].content;
      } else if (data && !Array.isArray(data) && data.content) {
        fullContent = data.content;
      }

      // If we got full content, switch to it. Since audio is already "unlocked", this should work.
      if (fullContent !== item.content) {
        tts.play(fullContent, key, true);
      }
    } catch (err) {
      console.error("Error fetching content details for speech:", err);
      // Fallback: we already started with item.content, so nothing more to do
    }
  };


  return (
    <div className="flex flex-col gap-6 pb-24">
      <hr className="border-t border-gray-200/80 -mt-2 mb-0 mx-2" />

      <div className="flex flex-col gap-6 mt-1">

        {isTopListLoading ? (
          <div className="flex items-center justify-center p-8 bg-glass backdrop-blur-zen border border-glass-border rounded-3xl shadow-sm">
            <div className="animate-spin text-sage-medium">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          </div>
        ) : topListError ? (
          <div className="p-5 bg-red-50 text-red-600 rounded-3xl text-sm font-medium border border-red-100 shadow-sm text-center">
            Failed to load top trending content.
          </div>
        ) : topList && topList.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {topList.map((item, index) => (
              <a
                key={item.recordId}
                href={item.url}
                onClick={(e) => {
                  e.preventDefault();
                  handleSpeak(item, index);
                }}
                className="flex items-center gap-4 p-3.5 bg-white/80 hover:bg-white rounded-2xl border border-gray-100/60 hover:border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-250 group no-underline cursor-pointer"
              >
                {/* Image with play overlay */}
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-sage-light/20 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400"
                  />
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
                      if (item.entityName) {
                        setBookmarkTarget({ entityName: item.entityName, recordId: item.recordId });
                      }
                    }}
                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-sage-dark hover:bg-sage-light/30 rounded-full transition-all duration-200"
                    aria-label="Bookmark"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-glass backdrop-blur-zen border border-glass-border rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-sage-light/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-sage-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-[0.9rem] font-bold text-sage-dark">No trending content found</p>
            <p className="text-[0.8rem] text-text-muted mt-1">Check back later for updates</p>
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
            // Optional: you can show a toast here in the future
            setBookmarkTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default ExplorePage;
