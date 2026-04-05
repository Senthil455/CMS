import React from 'react';
import { tabLabel } from './types';

interface ExploreTabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ExploreTabBar: React.FC<ExploreTabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  if (tabs.length <= 1) return null;

  return (
    <div className="flex gap-1.5 px-0.5 overflow-x-auto scrollbar-none">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`shrink-0 px-4 py-2 rounded-xl text-[0.8rem] font-bold transition-all duration-200 ${
            activeTab === tab
              ? 'bg-sage-dark text-white shadow-md shadow-sage-dark/20'
              : 'bg-white/70 text-sage-dark border border-gray-100/80 hover:bg-white hover:shadow-sm'
          }`}
        >
          {tabLabel(tab)}
        </button>
      ))}
    </div>
  );
};
