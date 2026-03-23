import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface TTSContextType {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  error: string | null;
  rate: number;
  play: (text: string, key: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (offset: number) => void;
  setRate: (rate: number) => void;
  chunks: { text: string, startOffset: number }[];
  currentChunkIndex: number;
  currentTitle: string | null;
  setCurrentTitle: (title: string | null) => void;
  isTranscriptOpen: boolean;
  setTranscriptOpen: (isOpen: boolean) => void;
}

const TTSContext = createContext<TTSContextType | null>(null);

export const TTSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const tts = useSpeechSynthesis();
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [isTranscriptOpen, setTranscriptOpen] = useState(false);

  const handlePlay = (text: string, key: string) => {
    tts.play(text, key);
  };

  return (
    <TTSContext.Provider value={{ 
      ...tts, 
      play: handlePlay, 
      currentTitle, 
      setCurrentTitle,
      isTranscriptOpen,
      setTranscriptOpen 
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
