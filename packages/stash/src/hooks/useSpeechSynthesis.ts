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
}

const CHUNK_SIZE = 4000;

export function useSpeechSynthesis() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    progress: 0,
    currentCharIndex: 0,
    totalChars: 0,
    chunks: [],
    currentChunkIndex: 0,
  });

  const chunksRef = useRef<{ text: string; startOffset: number }[]>([]);
  const currentChunkIndexRef = useRef(0);
  const playStateRef = useRef<'playing' | 'paused' | 'stopped'>('stopped');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentKeyRef = useRef<string | null>(null);
  
  // Progress tracking inside current chunk
  const chunkCharOffsetRef = useRef(0);

  const saveProgress = async () => {
    if (!currentKeyRef.current) return;
    
    // Calculate global offset: chunk start + offset within chunk
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

  const speakNextChunk = useCallback(() => {
    if (playStateRef.current !== 'playing') return;
    
    const nextChunkIndex = currentChunkIndexRef.current + 1;
    if (nextChunkIndex >= chunksRef.current.length) {
      // Done
      playStateRef.current = 'stopped';
      updateState({ isPlaying: false, isPaused: false, progress: 1 });
      saveProgress();
      return;
    }

    currentChunkIndexRef.current = nextChunkIndex;
    updateState({ currentChunkIndex: nextChunkIndex });
    speakCurrentChunk();
  }, []);

  const speakCurrentChunk = useCallback(() => {
    if (playStateRef.current !== 'playing') return;

    window.speechSynthesis.cancel();
    
    const chunk = chunksRef.current[currentChunkIndexRef.current];
    if (!chunk) return;

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utteranceRef.current = utterance;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        chunkCharOffsetRef.current = event.charIndex;
        const globalOffset = chunk.startOffset + event.charIndex;
        
        // Only update state occasionally to avoid too many re-renders
        if (event.charIndex % 20 === 0) {
           updateState({ 
             currentCharIndex: globalOffset,
             progress: state.totalChars > 0 ? globalOffset / state.totalChars : 0
           });
           
           // Periodically save progress
           if (event.charIndex % 100 === 0) {
             saveProgress();
           }
        }
      }
    };

    utterance.onend = () => {
      // Wait a tiny bit to ensure events are flushed and browser is ready for next
      setTimeout(() => {
         if (playStateRef.current === 'playing') {
             speakNextChunk();
         }
      }, 50);
    };

    utterance.onerror = (e) => {
      // Ignore errors caused by manual cancellation
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('Speech synthesis error:', e);
        playStateRef.current = 'stopped';
        updateState({ isPlaying: false, isPaused: false });
      }
    };

    window.speechSynthesis.speak(utterance);
    updateState({ isPlaying: true, isPaused: false });
  }, [speakNextChunk, state.totalChars]);

  // Strip HTML and split into chunks at sentence boundaries
  const prepareChunks = (htmlContent: string) => {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const text = doc.body.textContent || "";
    
    const chunks: { text: string; startOffset: number }[] = [];
    let currentStart = 0;

    // Simple sentence boundary split (., !, ?, \n)
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    
    let currentChunkText = '';
    let currentChunkStartOffset = 0;

    for (const sentence of sentences) {
      if (currentChunkText.length + sentence.length > CHUNK_SIZE && currentChunkText.length > 0) {
        chunks.push({ text: currentChunkText, startOffset: currentChunkStartOffset });
        currentChunkStartOffset += currentChunkText.length;
        currentChunkText = sentence;
      } else {
        currentChunkText += sentence;
      }
    }
    
    if (currentChunkText.length > 0) {
      chunks.push({ text: currentChunkText, startOffset: currentChunkStartOffset });
    }

    chunksRef.current = chunks;
    
    return { length: text.length, chunks };
  };

  const play = async (htmlContent: string, key: string, resume: boolean = true) => {
    // Clean up existing
    window.speechSynthesis.cancel();
    currentKeyRef.current = key;
    playStateRef.current = 'playing';
    chunkCharOffsetRef.current = 0;

    const { length: totalLength, chunks } = prepareChunks(htmlContent);
    updateState({ totalChars: totalLength, progress: 0, currentCharIndex: 0, chunks, currentChunkIndex: 0 });

    currentChunkIndexRef.current = 0;

    // Check for saved progress
    if (resume) {
      const saved = await getMetadata(`tts_progress_${key}`);
      if (saved && saved.offset !== undefined && saved.offset < totalLength - 100) {
        // Find which chunk this offset belongs to
        const offset = saved.offset;
        const chunkIndex = chunksRef.current.findIndex((c, i) => {
           const nextChunk = chunksRef.current[i+1];
           return nextChunk ? offset < nextChunk.startOffset : true;
        });
        
        if (chunkIndex >= 0) {
           currentChunkIndexRef.current = chunkIndex;
           
           // We need to slice the first chunk because we're starting mid-way
           const chunk = chunksRef.current[chunkIndex];
           const relativeOffset = offset - chunk.startOffset;
           
           if (relativeOffset > 0) {
               chunk.text = chunk.text.substring(relativeOffset);
               chunk.startOffset += relativeOffset; // Adjust offset so math still works
           }
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
    updateState({ isPlaying: false, isPaused: false, progress: 0, currentCharIndex: 0 });
  };
  
  const seek = (chunkIndex: number) => {
     if (!chunksRef.current || chunksRef.current.length === 0 || chunkIndex < 0 || chunkIndex >= chunksRef.current.length) return;
     
     // Stop current playback
     window.speechSynthesis.cancel();
     
     currentChunkIndexRef.current = chunkIndex;
     chunkCharOffsetRef.current = 0;
     updateState({ currentChunkIndex: chunkIndex });
     
     if (playStateRef.current === 'playing') {
       speakCurrentChunk();
     } else {
       playStateRef.current = 'playing';
       speakCurrentChunk();
     }
  };

  // Cleanup on unmount
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
    seek
  };
}
