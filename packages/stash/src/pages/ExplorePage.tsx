import React, { useState } from 'react';
import { BookmarkDialog } from '../components/BookmarkDialog';
import { ContentList } from '@/components/ContentList';
import { Content } from '@/types';
import { ContentViewer } from '@/components/ContentViewer';
import { useOnlineStatus } from '@/hooks';
import useSWR from 'swr';
import { useGetCmsAssetsUrl } from '@cms/sdk';

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
  const { isOnline } = useOnlineStatus();
  const getCmsAssetUrl = useGetCmsAssetsUrl();

  const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_URL ?? import.meta.env.VITE_APP_API_URL ?? '';
  const { data: topList, error: topListError, isLoading: isTopListLoading } = useSWR<TopListItem[]>(
    `${apiBaseUrl}/api/queries/topList`,
    (url: string) => fetch(url).then(res => res.json())
  );

  const handleSpeak = (content: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const doc = new DOMParser().parseFromString(content, 'text/html');
      const textContent = doc.body.textContent || "";
      const utterance = new SpeechSynthesisUtterance(textContent);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {topList.map(item => (
              <a
                key={item.recordId}
                href={item.url}
                className="flex flex-col gap-3 p-4 bg-glass backdrop-blur-zen border border-glass-border rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group no-underline"
              >
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-white/50 border border-white/20">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col gap-2 px-1 mt-2 pb-1 bg-transparent">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h3 className="text-[0.95rem] font-bold text-sage-dark leading-tight line-clamp-2 flex-1 min-w-0">{item.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.entityName) {
                            setBookmarkTarget({ entityName: item.entityName, recordId: item.recordId });
                          }
                        }}
                        className="p-1.5 shrink-0 bg-sage-light/30 hover:bg-sage-light/60 text-sage-dark rounded-full transition-colors"
                        aria-label="Bookmark"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSpeak(item.content);
                        }}
                        className="p-1.5 shrink-0 bg-sage-light/30 hover:bg-sage-light/60 text-sage-dark rounded-full transition-colors"
                        aria-label="Play text-to-speech"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    </div>
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
