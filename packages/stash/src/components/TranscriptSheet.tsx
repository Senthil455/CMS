import React, { useEffect, useRef } from 'react';
import { useTTS } from '../contexts/TTSContext';

export const TranscriptSheet: React.FC = () => {
  const { isTranscriptOpen, setTranscriptOpen, chunks, currentChunkIndex, seek, currentTitle } = useTTS();
  const activeChunkRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (isTranscriptOpen && activeChunkRef.current) {
      activeChunkRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentChunkIndex, isTranscriptOpen]);

  if (!isTranscriptOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-lg font-bold text-sage-dark line-clamp-1 flex-1 pr-4">
          {currentTitle || 'Transcript'}
        </h2>
        <button
          onClick={() => setTranscriptOpen(false)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-4 pb-36">
        <div className="max-w-2xl mx-auto">
          {chunks.length === 0 ? (
            <p className="text-center text-text-muted mt-10">No transcript available.</p>
          ) : (
            chunks.map((chunk, index) => {
              const isActive = index === currentChunkIndex;

              return (
                <div
                  key={index}
                  ref={isActive ? activeChunkRef : null}
                  onClick={() => seek(index)}
                  className={`px-3 py-2 my-1 rounded-xl transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-amber-50 border border-amber-300 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <p className={`text-base leading-relaxed ${
                    isActive
                      ? 'text-amber-900 font-semibold'
                      : 'text-gray-600'
                  }`}>
                    {chunk.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
