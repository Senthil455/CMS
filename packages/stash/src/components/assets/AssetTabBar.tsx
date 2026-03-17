import React from 'react';

export type AssetTab = 'all' | 'video' | 'audio' | 'image';

interface AssetTabBarProps {
  activeTab: AssetTab;
  onTabChange: (tab: AssetTab) => void;
}

const AssetTabBar: React.FC<AssetTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: AssetTab[] = ['all', 'video', 'audio', 'image'];

  return (
    <div className="flex gap-2 p-1 bg-sage-light/50 rounded-2xl w-fit sticky top-0 z-10 backdrop-blur-md">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-1.5 rounded-xl text-[0.75rem] font-bold transition-all duration-300 ${
            activeTab === tab 
              ? 'bg-white text-sage-dark shadow-sm' 
              : 'text-text-muted hover:text-sage-dark'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default AssetTabBar;
