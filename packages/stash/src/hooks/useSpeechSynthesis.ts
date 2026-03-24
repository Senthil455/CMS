import { useState, useEffect, useRef, useCallback } from 'react';
import { setMetadata, getMetadata } from '../utils/storage';

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0 to 1
  currentCharIndex: number;
  totalChars: number;
  chunks: { text: string, startOffset: number }[];
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

  // chunksRef holds one entry per sentence - each is also one utterance
  const chunksRef = useRef<{ text: string; startOffset: number }[]>([]);
  const currentChunkIndexRef = useRef(0);
  const playStateRef = useRef<'playing' | 'paused' | 'stopped'>('stopped');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentKeyRef = useRef<string | null>(null);
  const chunkCharOffsetRef = useRef(0);
  const totalCharsRef = useRef(0);
  // Cache voices eagerly so speakCurrentChunk can use them synchronously
  const voicesCacheRef = useRef<SpeechSynthesisVoice[]>([]);
  const rateRef = useRef(1);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const saveProgress = () => {
    if (!currentKeyRef.current) return;
    const currentChunk = chunksRef.current[currentChunkIndexRef.current];
    if (!currentChunk) return;
    const globalOffset = currentChunk.startOffset + chunkCharOffsetRef.current;
    
    const progressData = {
      offset: globalOffset,
      timestamp: Date.now()
    };
    
    // Use localStorage for synchronous access (critical for iOS Safari resume)
    try {
      localStorage.setItem(`tts_progress_${currentKeyRef.current}`, JSON.stringify(progressData));
    } catch (e) {
      console.warn('Failed to save TTS progress to localStorage:', e);
    }
    
    // Also save to indexedDB as backup/long-term storage
    setMetadata(`tts_progress_${currentKeyRef.current}`, progressData);
  };


  const updateState = (newState: Partial<TTSState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const pickVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const candidates = enVoices.length > 0 ? enVoices : voices;
    return candidates.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Daniel') ||
      v.name.includes('Google') ||
      v.name.includes('Natural') ||
      v.name.includes('Premium') ||
      v.name.includes('Enhanced')
    ) || candidates[0] || voices[0] || null;
  }, []);

  // Eagerly load and cache voices on mount (critical for iOS auto-start)
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesCacheRef.current = voices;
        if (!selectedVoiceRef.current) {
          const defaultVoice = pickVoice(voices);
          selectedVoiceRef.current = defaultVoice;
          updateState({ voices, selectedVoice: defaultVoice });
        } else {
          updateState({ voices });
        }
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [pickVoice]);



  const speakCurrentChunk = useCallback(() => {
    if (playStateRef.current !== 'playing') return;

    window.speechSynthesis.cancel();

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    if (!chunk) return;

    // Use cached voices synchronously - no async needed (iOS-safe)
    const voices = voicesCacheRef.current;

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = rateRef.current;
    const voice = selectedVoiceRef.current || pickVoice(voices);
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
          if (event.charIndex % 100 === 0) saveProgress();
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
          saveProgress();
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
  }, []);

  // Strip HTML, split into one sentence per chunk (= one utterance per sentence for highlighting)
  const prepareChunks = (htmlContent: string) => {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const text = doc.body.textContent || '';

    // Split at sentence boundaries: period/exclamation/question followed by space or end
    const matches = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
    const chunks: { text: string; startOffset: number }[] = [];
    let offset = 0;
    for (const raw of matches) {
      const trimmed = raw.trim();
      if (trimmed) {
        chunks.push({ text: trimmed, startOffset: offset });
      }
      offset += raw.length;
    }

    chunksRef.current = chunks;
    return { length: text.length, chunks };
  };

  const play = (htmlContent: string, key: string, resume: boolean = true) => {
    const isSameKey = currentKeyRef.current === key;
    const isAlreadyPlaying = playStateRef.current === 'playing';

    // If already playing the same content (or teaser), just update chunks for seamless transition
    if (isSameKey && isAlreadyPlaying) {
      const { length: totalLength, chunks } = prepareChunks(htmlContent);
      totalCharsRef.current = totalLength;
      updateState({ totalChars: totalLength, chunks });
      return;
    }

    window.speechSynthesis.cancel();
    currentKeyRef.current = key;
    playStateRef.current = 'playing';
    chunkCharOffsetRef.current = 0;

    const { length: totalLength, chunks } = prepareChunks(htmlContent);
    totalCharsRef.current = totalLength;
    updateState({ totalChars: totalLength, progress: 0, currentCharIndex: 0, chunks, currentChunkIndex: 0, error: null });
    currentChunkIndexRef.current = 0;

    if (resume) {
      // Synchronously check localStorage for progress to avoid async gaps on iOS
      try {
        const savedStr = localStorage.getItem(`tts_progress_${key}`);
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          if (saved && saved.offset !== undefined && saved.offset < totalLength - 100) {
            const offset = saved.offset;
            const sentenceIndex = chunksRef.current.findIndex((c, i) => {
              const next = chunksRef.current[i + 1];
              return next ? offset < next.startOffset : true;
            });
            if (sentenceIndex >= 0) {
              currentChunkIndexRef.current = sentenceIndex;
              updateState({ currentChunkIndex: sentenceIndex });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load TTS progress from localStorage:', e);
      }
    }

    // Start speaking synchronously (crucial for iOS Safari)
    if (chunksRef.current.length > 0) {
      speakCurrentChunk();
    } else {
      playStateRef.current = 'stopped';
      updateState({ isPlaying: false, isPaused: false });
    }
  };



  const pause = () => {
    playStateRef.current = 'paused';
    window.speechSynthesis.pause();
    saveProgress();
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
    saveProgress();
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
    // If currently playing, restart current chunk at the new rate
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
      saveProgress();
      window.speechSynthesis.cancel();
    };
  }, []);

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
