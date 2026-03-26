import { useState, useEffect, useRef, useCallback } from 'react';
import { useTTSVoices } from './useTTSVoices';
import { useTTSContent, TTSChunk } from './useTTSContent';
import { useTTSProgress } from './useTTSProgress';

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0 to 1
  currentCharIndex: number;
  totalChars: number;
  chunks: TTSChunk[];
  currentChunkIndex: number;
  error: string | null;
  rate: number;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
}

export function useSpeechSynthesis() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    progress: 0,
    currentCharIndex: 0,
    totalChars: 0,
    chunks: [],
    currentChunkIndex: 0,
    error: null,
    rate: 1,
    voices: [],
    selectedVoice: null,
  });

  const currentKeyRef = useRef<string | null>(null);
  const playStateRef = useRef<'playing' | 'paused' | 'stopped'>('stopped');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalCharsRef = useRef(0);
  const rateRef = useRef(1);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const { voices, voicesCacheRef, pickVoice } = useTTSVoices();
  const { chunksRef, prepareChunks, detectLang } = useTTSContent();
  const { chunkCharOffsetRef, currentChunkIndexRef, saveProgress, loadProgress } = useTTSProgress(currentKeyRef);

  const updateState = useCallback((newState: Partial<TTSState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Sync voices from hook to state
  useEffect(() => {
    updateState({ voices });
  }, [voices, updateState]);

  const speakCurrentChunk = useCallback(() => {
    if (playStateRef.current !== 'playing') return;

    window.speechSynthesis.cancel();

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    if (!chunk) return;

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = rateRef.current;
    
    // Detect language from chunk content; user-explicit selection overrides
    const detectedLang = chunk.lang || detectLang(chunk.text);
    const voice = selectedVoiceRef.current || pickVoice(voicesCacheRef.current, detectedLang);
    if (voice) utterance.voice = voice;
    utteranceRef.current = utterance;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        chunkCharOffsetRef.current = event.charIndex;
        const globalOffset = chunk.startOffset + event.charIndex;
        if (event.charIndex % 20 === 0) {
          updateState({
            currentCharIndex: globalOffset,
            progress: totalCharsRef.current > 0 ? globalOffset / totalCharsRef.current : 0,
          });
          if (event.charIndex % 100 === 0) saveProgress(chunksRef.current);
        }
      }
    };

    utterance.onend = () => {
      setTimeout(() => {
        if (playStateRef.current !== 'playing') return;
        const nextIndex = currentChunkIndexRef.current + 1;
        if (nextIndex >= chunksRef.current.length) {
          playStateRef.current = 'stopped';
          updateState({ isPlaying: false, isPaused: false, progress: 1 });
          saveProgress(chunksRef.current);
          return;
        }
        currentChunkIndexRef.current = nextIndex;
        chunkCharOffsetRef.current = 0;
        updateState({ currentChunkIndex: nextIndex });
        speakCurrentChunk();
      }, 50);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('Speech synthesis error:', e);
        playStateRef.current = 'stopped';
        updateState({ isPlaying: false, isPaused: false, error: `Speech synthesis error: ${e.error}` });
      }
    };

    window.speechSynthesis.speak(utterance);
    updateState({ isPlaying: true, isPaused: false });
  }, [chunksRef, currentChunkIndexRef, detectLang, pickVoice, voicesCacheRef, updateState, saveProgress]);


  const play = async (htmlContent: string, key: string, resume: boolean = true) => {
    const isSameKey = currentKeyRef.current === key;
    const isAlreadyPlaying = playStateRef.current === 'playing';

    if (isSameKey && isAlreadyPlaying) {
      const { totalChars, chunks } = prepareChunks(htmlContent);
      totalCharsRef.current = totalChars;
      updateState({ totalChars, chunks });
      return;
    }

    window.speechSynthesis.cancel();
    currentKeyRef.current = key;
    playStateRef.current = 'playing';
    chunkCharOffsetRef.current = 0;

    const { totalChars, chunks } = prepareChunks(htmlContent);
    totalCharsRef.current = totalChars;
    updateState({ totalChars, progress: 0, currentCharIndex: 0, chunks, currentChunkIndex: 0, error: null });
    currentChunkIndexRef.current = 0;

    if (resume) {
      const sentenceIndex = loadProgress(key, totalChars, chunks);
      currentChunkIndexRef.current = sentenceIndex;
      updateState({ currentChunkIndex: sentenceIndex });
    }

    if (chunks.length > 0) {
      speakCurrentChunk();
    } else {
      playStateRef.current = 'stopped';
      updateState({ isPlaying: false, isPaused: false });
    }
  };

  const pause = () => {
    playStateRef.current = 'paused';
    window.speechSynthesis.pause();
    saveProgress(chunksRef.current);
    updateState({ isPlaying: false, isPaused: true });
  };

  const resume = () => {
    playStateRef.current = 'playing';
    window.speechSynthesis.resume();
    updateState({ isPlaying: true, isPaused: false });
  };

  const stop = () => {
    playStateRef.current = 'stopped';
    window.speechSynthesis.cancel();
    saveProgress(chunksRef.current);
    updateState({ isPlaying: false, isPaused: false, progress: 0, currentCharIndex: 0, error: null });
  };

  const seek = (chunkIndex: number) => {
    if (!chunksRef.current || chunksRef.current.length === 0 || chunkIndex < 0 || chunkIndex >= chunksRef.current.length) return;
    window.speechSynthesis.cancel();
    currentChunkIndexRef.current = chunkIndex;
    chunkCharOffsetRef.current = 0;
    updateState({ currentChunkIndex: chunkIndex });
    playStateRef.current = 'playing';
    speakCurrentChunk();
  };

  const setRate = (newRate: number) => {
    rateRef.current = newRate;
    updateState({ rate: newRate });
    if (playStateRef.current === 'playing') {
      window.speechSynthesis.cancel();
      speakCurrentChunk();
    }
  };

  const setVoice = (voice: SpeechSynthesisVoice) => {
    selectedVoiceRef.current = voice;
    updateState({ selectedVoice: voice });
    if (playStateRef.current === 'playing') {
      window.speechSynthesis.cancel();
      speakCurrentChunk();
    }
  };

  useEffect(() => {
    return () => {
      saveProgress(chunksRef.current);
      window.speechSynthesis.cancel();
    };
  }, [saveProgress, chunksRef]);

  return {
    ...state,
    play,
    pause,
    resume,
    stop,
    seek,
    setRate,
    setVoice,
  };
}
