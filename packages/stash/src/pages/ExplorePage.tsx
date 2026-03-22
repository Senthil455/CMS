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

  const handleSpeak = async (item: TopListItem) => {
    tts.setCurrentTitle(item.title);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/queries/contentTag?entityName=${item.entityName}&recordId=${item.recordId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content details');
      }
      const data = await response.json();
      
      let speechContent = item.content;
      if (Array.isArray(data) && data.length > 0 && data[0].content) {
        speechContent = data[0].content;
      } else if (data && !Array.isArray(data) && data.content) {
        speechContent = data.content;
      }
      
      tts.play(speechContent, `${item.entityName}_${item.recordId}`);
    } catch (err) {
      console.error("Error fetching content details for speech:", err);
      tts.play(item.content, `${item.entityName}_${item.recordId}`);
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
          <div className="grid grid-cols-1 gap-[1px] bg-gray-200/40 rounded-2xl overflow-hidden border border-gray-200/40 shadow-sm">
            {topList.map(item => (
              <a
                key={item.recordId}
                href={item.url}
                className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/95 transition-all duration-200 group no-underline cursor-pointer"
              >
                {/* Image */}
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-sage-light/20">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.entityName) {
                        setBookmarkTarget({ entityName: item.entityName, recordId: item.recordId });
                      }
                    }}
                    className="w-9 h-9 flex items-center justify-center text-sage-medium hover:text-sage-dark hover:bg-sage-light/30 rounded-full transition-colors"
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
