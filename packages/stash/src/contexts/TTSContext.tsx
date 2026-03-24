import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface TTSContextType {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  error: string | null;
  rate: number;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  play: (text: string, key: string, resume?: boolean) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (offset: number) => void;
  setRate: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  chunks: { text: string, startOffset: number }[];
  currentChunkIndex: number;
  currentTitle: string | null;
  setCurrentTitle: (title: string | null) => void;
  isTranscriptOpen: boolean;
  setTranscriptOpen: (isOpen: boolean) => void;
  // Playlist support
  playlist: any[];
  currentIndex: number;
  setPlaylist: (items: any[], index: number, onPlayItem: (item: any) => void) => void;
  next: () => void;
  previous: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const TTSContext = createContext<TTSContextType | null>(null);

export const TTSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const tts = useSpeechSynthesis();
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [isTranscriptOpen, setTranscriptOpen] = useState(false);

  // Playlist state
  const [playlist, setPlaylistState] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [onPlayItem, setOnPlayItem] = useState<((item: any) => void) | null>(null);

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

  const hasNext = currentIndex < playlist.length - 1;
  const hasPrevious = currentIndex > 0;

  const handlePlay = (text: string, key: string, resume: boolean = true) => {
    tts.play(text, key, resume);
  };

  return (
    <TTSContext.Provider value={{ 
      ...tts, 
      play: handlePlay, 
      currentTitle, 
      setCurrentTitle,
      isTranscriptOpen,
      setTranscriptOpen,
      playlist,
      currentIndex,
      setPlaylist,
      next,
      previous,
      hasNext,
      hasPrevious
    }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};
