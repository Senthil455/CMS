import React from 'react';
import { TopListItem } from '@/types';

interface ExploreListItemProps {
  item: TopListItem;
  onItemClick: () => void;
  onPlayClick: () => void;
  onBookmark: () => void;
}

export const ExploreListItem: React.FC<ExploreListItemProps> = ({
  item,
  onItemClick,
  onPlayClick,
  onBookmark,
}) => (
  <a
    href={item.url}
    onClick={(e) => {
      e.preventDefault();
      onItemClick();
    }}
    className="flex items-center gap-4 p-3.5 bg-white/80 hover:bg-white rounded-2xl border border-gray-100/60 hover:border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-250 group no-underline cursor-pointer"
  >
    {/* Image with play overlay */}
    <div
      className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-sage-light/20 relative"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPlayClick();
      }}
    >
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
        {new Date(item.publishedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </div>

    {/* Actions */}
    <div className="flex flex-col items-center gap-2 shrink-0">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark();
        }}
        className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-sage-dark hover:bg-sage-light/30 rounded-full transition-all duration-200"
        aria-label="Bookmark"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  </a>
);
