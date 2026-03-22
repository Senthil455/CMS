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
  });

  // chunksRef holds one entry per sentence - each is also one utterance
  const chunksRef = useRef<{ text: string; startOffset: number }[]>([]);
  const currentChunkIndexRef = useRef(0);
  const playStateRef = useRef<'playing' | 'paused' | 'stopped'>('stopped');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentKeyRef = useRef<string | null>(null);
  const chunkCharOffsetRef = useRef(0);
  const totalCharsRef = useRef(0);

  const saveProgress = async () => {
    if (!currentKeyRef.current) return;
    const currentChunk = chunksRef.current[currentChunkIndexRef.current];
    if (!currentChunk) return;
    const globalOffset = currentChunk.startOffset + chunkCharOffsetRef.current;
    await setMetadata(`tts_progress_${currentKeyRef.current}`, {
      offset: globalOffset,
      timestamp: Date.now()
    });
  };

  const updateState = (newState: Partial<TTSState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // iOS Safari loads voices asynchronously.
  const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) { resolve(voices); return; }
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      }, 1500);
    });
  };

  const pickVoice = (voices: SpeechSynthesisVoice[]) => {
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
  };

  const speakCurrentChunk = useCallback(async () => {
    if (playStateRef.current !== 'playing') return;

    window.speechSynthesis.cancel();
    // iOS Safari: short delay after cancel before next speak
    await new Promise(resolve => setTimeout(resolve, 100));
    if (playStateRef.current !== 'playing') return;

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    if (!chunk) return;

    const voices = await waitForVoices();
    if (playStateRef.current !== 'playing') return;

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    const voice = pickVoice(voices);
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

  const play = async (htmlContent: string, key: string, resume: boolean = true) => {
    // iOS Safari: warm-up speak within user gesture context
    const warmUp = new SpeechSynthesisUtterance('');
    warmUp.volume = 0;
    window.speechSynthesis.speak(warmUp);

    window.speechSynthesis.cancel();
    currentKeyRef.current = key;
    playStateRef.current = 'playing';
    chunkCharOffsetRef.current = 0;

    const { length: totalLength, chunks } = prepareChunks(htmlContent);
    totalCharsRef.current = totalLength;
    updateState({ totalChars: totalLength, progress: 0, currentCharIndex: 0, chunks, currentChunkIndex: 0, error: null });
    currentChunkIndexRef.current = 0;

    if (resume) {
      const saved = await getMetadata(`tts_progress_${key}`);
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
  };
}
