import React from 'react';
import useSWR from 'swr';
import { TranscriptSheetHandle } from '../TranscriptSheet';
import { ExploreListItem } from './ExploreListItem';
import { TopListItem, apiBaseUrl, fetcher, tabLabel } from './types';

interface ExploreTabContentProps {
  queryName: string;
  sheetRef: React.RefObject<TranscriptSheetHandle | null>;
  onBookmark: (target: { entityName: string; recordId: string }) => void;
}

export const ExploreTabContent: React.FC<ExploreTabContentProps> = ({ queryName, sheetRef, onBookmark }) => {
  const url = `${apiBaseUrl}/api/queries/${queryName}?normalizeTagFields=true`;
  const { data: list, error, isLoading } = useSWR<TopListItem[]>(url, fetcher);

  const handleSpeak = async (item: TopListItem, index: number, autoPlay: boolean = true) => {
    const actualRecordId = item.recordId ?? item.__record_id ?? item.id ?? String(index);
    const key = `${item.entityName || 'unknown'}_${actualRecordId}`;
    let fullContent = item.content || item.subtitle || item.title || 'No content provided.';

    if (item.entityName && actualRecordId) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/queries/contentTag?entityName=${item.entityName}&recordId=${actualRecordId}`
        );
        if (!response.ok) throw new Error('Failed to fetch content details');
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0 && data[0].content) {
          fullContent = data[0].content;
        } else if (data && !Array.isArray(data) && data.content) {
          fullContent = data.content;
        }
      } catch (err) {
        console.error('Error fetching content details for speech:', err);
      }
    }

    sheetRef.current?.speak(
      fullContent,
      item.title,
      key,
      list
        ? {
          items: list,
          index,
          onPlayItem: (newItem: TopListItem) =>
            handleSpeak(newItem, list.indexOf(newItem), true),
        }
        : undefined,
      autoPlay
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-glass backdrop-blur-zen border border-glass-border rounded-3xl shadow-sm">
        <div className="animate-spin text-sage-medium">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-50 text-red-600 rounded-3xl text-sm font-medium border border-red-100 shadow-sm text-center">
        Failed to load content for <strong>{tabLabel(queryName)}</strong>.
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-glass backdrop-blur-zen border border-glass-border rounded-3xl text-center shadow-sm">
        <div className="w-16 h-16 bg-sage-light/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-sage-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <p className="text-[0.9rem] font-bold text-sage-dark">No content found</p>
        <p className="text-[0.8rem] text-text-muted mt-1">Check back later for updates</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {list.map((item, index) => {
        const actualRecordId = item.recordId ?? item.__record_id ?? item.id ?? String(index);
        return (
          <ExploreListItem
            key={actualRecordId}
            item={item}
            onItemClick={() => handleSpeak(item, index, false)}
            onPlayClick={() => handleSpeak(item, index, true)}
            onBookmark={() => {
              if (item.entityName) {
                onBookmark({ entityName: item.entityName, recordId: String(actualRecordId) });
              }
            }}
          />
        );
      })}
    </div>
  );
};
