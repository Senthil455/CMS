import { useState, useEffect } from 'react';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useSleepTimer } from '../contexts/SleepTimerContext';

/**
 * Internal hook used by TranscriptSheet.
 * Owns the TTS engine, sheet open state, title, and playlist.
 * Pauses automatically when the global sleep timer expires.
 */
export function useTTSPlayer(pause: () => void) {
  const sleepTimer = useSleepTimer();
  const [isTranscriptOpen, setTranscriptOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  // Playlist
  const [playlist, setPlaylistState] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [onPlayItem, setOnPlayItem] = useState<((item: any) => void) | null>(null);

  // Stop when global sleep timer fires
  useEffect(() => {
    if (sleepTimer.expired) {
      pause();
    }
  }, [sleepTimer.expired, pause]);

  const setPlaylist = (items: any[], index: number, onPlay: (item: any) => void) => {
    setPlaylistState(items);
    setCurrentIndex(index);
    setOnPlayItem(() => onPlay);
  };

  const next = () => {
    if (currentIndex < playlist.length - 1 && onPlayItem) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      onPlayItem(playlist[nextIndex]);
    }
  };

  const previous = () => {
    if (currentIndex > 0 && onPlayItem) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      onPlayItem(playlist[prevIndex]);
    }
  };

  return {
    // Sheet visibility
    isTranscriptOpen,
    setTranscriptOpen,
    // Title
    currentTitle,
    setCurrentTitle,
    // Playlist
    setPlaylist,
    next,
    previous,
    hasNext: currentIndex < playlist.length - 1,
    hasPrevious: currentIndex > 0,
  };
}
