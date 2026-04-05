import React, { useState, useRef } from 'react';
import { BookmarkDialog } from '../components/BookmarkDialog';
import { TranscriptSheet, TranscriptSheetHandle } from '../components/TranscriptSheet';
import { useExploreSettings } from '../hooks/useExploreSettings';
import { ExploreTabBar } from '../components/explore/ExploreTabBar';
import { ExploreTabContent } from '../components/explore/ExploreTabContent';

const ExplorePage: React.FC = () => {
  const [bookmarkTarget, setBookmarkTarget] = useState<{ entityName: string; recordId: string } | null>(null);
  const sheetRef = useRef<TranscriptSheetHandle>(null);
  const { settings } = useExploreSettings();

  const tabs = settings.selectedTabs;
  const [activeTab, setActiveTab] = useState<string>(() => tabs[0] ?? 'topList');

  // Keep active tab valid when settings change
  const effectiveTab = tabs.includes(activeTab) ? activeTab : (tabs[0] ?? 'topList');

  return (
    <div className="flex flex-col gap-4 pb-24">
      <hr className="border-t border-gray-200/80 -mt-2 mb-0 mx-2" />

      <ExploreTabBar tabs={tabs} activeTab={effectiveTab} onTabChange={setActiveTab} />

      {tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-[0.9rem] font-bold text-sage-dark">No tabs selected</p>
          <p className="text-[0.8rem] text-text-muted mt-1">Open the avatar menu → Explore Settings to choose tabs.</p>
        </div>
      ) : (
        <ExploreTabContent
          key={effectiveTab}
          queryName={effectiveTab}
          sheetRef={sheetRef}
          onBookmark={setBookmarkTarget}
        />
      )}

      {bookmarkTarget && (
        <BookmarkDialog
          isOpen={true}
          entityName={bookmarkTarget.entityName}
          recordId={bookmarkTarget.recordId}
          onClose={() => setBookmarkTarget(null)}
          onSaved={() => setBookmarkTarget(null)}
        />
      )}

      <TranscriptSheet ref={sheetRef} />
    </div>
  );
};

export default ExplorePage;
