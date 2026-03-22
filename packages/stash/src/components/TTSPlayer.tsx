import React from 'react';

interface TTSPlayerProps {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onViewTranscript?: () => void;
  title?: string;
}

export const TTSPlayer: React.FC<TTSPlayerProps> = ({
  isPlaying,
  isPaused,
  progress,
  onPlay,
  onPause,
  onResume,
  onStop,
  onViewTranscript,
  title
}) => {
  if (!isPlaying && !isPaused) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-sage-light/50 p-4 z-50 flex flex-col gap-2">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-sage-medium transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex-1 min-w-0 pr-4">
           {title && (
             <p className="text-sm font-bold text-sage-dark truncate">{title}</p>
           )}
           <p className="text-xs text-text-muted">
             {isPlaying ? 'Playing...' : 'Paused'}
           </p>
         </div>

         <div className="flex items-center gap-3 shrink-0">
            {onViewTranscript && (
              <button 
                onClick={onViewTranscript}
                className="text-xs font-semibold text-sage-medium hover:text-sage-dark px-2 py-1 rounded-lg hover:bg-sage-light/20 transition-colors"
              >
                Transcript
              </button>
            )}

            {isPlaying ? (
              <button 
                onClick={onPause}
                className="w-10 h-10 flex items-center justify-center bg-sage-dark text-white rounded-full shadow-md active:scale-95 transition-transform"
              >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                 </svg>
              </button>
            ) : (
              <button 
                onClick={onResume}
                className="w-10 h-10 flex items-center justify-center bg-sage-dark text-white rounded-full shadow-md active:scale-95 transition-transform"
              >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="ml-1">
                    <polygon points="5 3 19 12 5 21 5 3" />
                 </svg>
              </button>
            )}

            <button 
              onClick={onStop}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="5" y="5" width="14" height="14" />
               </svg>
            </button>
         </div>
      </div>
    </div>
  );
};
