import React, { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ContentList } from '@/components/ContentList';
import { Content } from '@/types';
import { ContentViewer } from '@/components/ContentViewer';
import { useOnlineStatus } from '@/hooks';

const ExplorePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const { isOnline } = useOnlineStatus();

  return (
    <div className="flex flex-col gap-4">
      <SearchBar onSearch={setSearchQuery} placeholder="Search videos, articles, and more..." />


      <div className="flex flex-col gap-6 mt-2">
        {selectedContent ? (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setSelectedContent(null)}
              className="self-start text-[0.85rem] font-bold text-primary-color hover:underline flex items-center gap-1"
            >
              ← Back to list
            </button>
            <ContentViewer content={selectedContent} isOnline={isOnline} />
          </div>
        ) : (
          <ContentList 
            onSelectContent={setSelectedContent} 
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
