import React, { useEffect, useRef } from 'react';
import { useTTS } from '../contexts/TTSContext';

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const TranscriptSheet: React.FC = () => {
  const { 
    isTranscriptOpen, setTranscriptOpen, chunks, currentChunkIndex, seek, currentTitle, 
    rate, setRate, voices, selectedVoice, setVoice, isPlaying, isPaused, pause, resume, stop,
    next, previous, hasNext, hasPrevious
  } = useTTS();
  const activeChunkRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (isTranscriptOpen && activeChunkRef.current) {
      activeChunkRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentChunkIndex, isTranscriptOpen]);

  if (!isTranscriptOpen) return null;

  const currentPresetIndex = SPEED_PRESETS.indexOf(rate);
  const canDecrease = currentPresetIndex > 0;
  const canIncrease = currentPresetIndex < SPEED_PRESETS.length - 1;

  const handleDecrease = () => {
    if (canDecrease) setRate(SPEED_PRESETS[currentPresetIndex - 1]);
  };

  const handleIncrease = () => {
    if (canIncrease) setRate(SPEED_PRESETS[currentPresetIndex + 1]);
  };

  const formatRate = (r: number) => `${r === 1 ? '1' : r}×`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col zen-gradient-bg animate-[slideUpFullScreen_0.4s_cubic-bezier(0.16,1,0.3,1)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border bg-glass backdrop-blur-zen sticky top-0 z-20 shadow-sm">
        <h2 className="text-lg font-bold text-sage-dark line-clamp-1 flex-1 pr-4">
          {currentTitle || 'Transcript'}
        </h2>
        
        {/* Progress Indicator */}
        {chunks.length > 0 && (
          <div className="hidden sm:flex items-center px-3 py-1 bg-white/40 rounded-full border border-gray-100/50 mr-4">
            <span className="text-xs font-semibold text-sage-dark tabular-nums">
              {currentChunkIndex + 1} <span className="text-gray-400 font-medium">/ {chunks.length}</span>
            </span>
          </div>
        )}

        <button
          onClick={() => setTranscriptOpen(false)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-gray-500 hover:text-sage-dark transition-all shadow-sm"
          aria-label="Close transcript"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {/* Speed & Voice Controls */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-glass-border bg-glass backdrop-blur-zen overflow-x-auto hide-scrollbar z-10 shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-full border border-white/50 shadow-sm">
            <button
              onClick={previous}
              disabled={!hasPrevious}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                hasPrevious
                  ? 'bg-white text-sage-dark hover:bg-sage-light active:scale-95 shadow-sm'
                  : 'bg-transparent text-gray-300 cursor-not-allowed'
              }`}
              title="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5"></line>
              </svg>
            </button>

            {isPlaying && !isPaused ? (
              <button
                onClick={pause}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-sage-light text-sage-dark hover:bg-sage-medium hover:text-white transition-all active:scale-95 shadow-md border border-sage-medium/30"
                title="Pause"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
              </button>
            ) : (
              <button
                onClick={resume}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-sage-dark text-white hover:bg-sage-medium transition-all active:scale-95 shadow-md border border-sage-dark"
                title="Play"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
            )}

            <button
              onClick={next}
              disabled={!hasNext}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                hasNext
                  ? 'bg-white text-sage-dark hover:bg-sage-light active:scale-95 shadow-sm'
                  : 'bg-transparent text-gray-300 cursor-not-allowed'
              }`}
              title="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
            </button>
            
            <div className="w-px h-6 bg-sage-medium/30 mx-1" />

            <button
              onClick={stop}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
              title="Stop"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/40 p-1.5 rounded-full border border-white/50 shadow-sm px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sage-dark mr-1 opacity-70">Speed</span>
            <button
              onClick={handleDecrease}
              disabled={!canDecrease}
              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-lg transition-colors ${
                canDecrease
                  ? 'bg-white text-sage-dark hover:bg-sage-light active:scale-95 shadow-sm'
                  : 'bg-transparent text-gray-300 cursor-not-allowed'
              }`}
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-sage-dark tabular-nums">
              {formatRate(rate)}
            </span>
            <button
              onClick={handleIncrease}
              disabled={!canIncrease}
              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-lg transition-colors ${
                canIncrease
                  ? 'bg-white text-sage-dark hover:bg-sage-light active:scale-95 shadow-sm'
                  : 'bg-transparent text-gray-300 cursor-not-allowed'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {voices.length > 0 && (
          <div className="flex items-center shrink-0">
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = voices.find(v => v.name === e.target.value);
                if (voice) setVoice(voice);
              }}
              className="text-sm font-semibold text-sage-dark bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm rounded-xl pl-3 pr-8 py-2 outline-none focus:border-sage-medium transition-colors w-[160px] text-ellipsis whitespace-nowrap overflow-hidden cursor-pointer appearance-none"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%233a5a42" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              title={selectedVoice?.name || 'Select Voice'}
            >
              <option value="" disabled>Select Voice</option>
              {voices.map(v => (
                <option key={v.name} value={v.name} title={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-6 pb-36 scroll-smooth">
        <div className="max-w-2xl mx-auto">
          {chunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/40 backdrop-blur-sm border border-white/60 rounded-3xl mt-10 shadow-sm">
              <svg className="w-12 h-12 text-sage-medium/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <p className="text-sage-dark font-medium">No transcript available.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chunks.map((chunk, index) => {
                const isActive = index === currentChunkIndex;

                return (
                  <div
                    key={index}
                    ref={isActive ? activeChunkRef : null}
                    onClick={() => seek(index)}
                    className={`px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-sage-light/70 border border-sage-medium/40 shadow-zen transcript-active-chunk scale-[1.02]'
                        : 'hover:bg-white/60 border border-transparent text-gray-500'
                    }`}
                  >
                    <p className={`text-[1.05rem] leading-relaxed transition-colors duration-300 ${
                      isActive
                        ? 'text-sage-dark font-semibold'
                        : 'text-gray-600'
                    }`}>
                      {chunk.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
