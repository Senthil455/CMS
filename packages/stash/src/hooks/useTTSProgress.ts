import { useRef, useCallback, MutableRefObject } from 'react';
import { setMetadata } from '../utils/storage';
import { TTSChunk } from './useTTSContent';

export function useTTSProgress(currentKeyRef: MutableRefObject<string | null>) {
  const chunkCharOffsetRef = useRef(0);
  const currentChunkIndexRef = useRef(0);

  const saveProgress = useCallback((chunks: TTSChunk[]) => {
    if (!currentKeyRef.current) return;
    const currentChunk = chunks[currentChunkIndexRef.current];
    if (!currentChunk) return;
    const globalOffset = currentChunk.startOffset + chunkCharOffsetRef.current;

    const progressData = {
      offset: globalOffset,
      timestamp: Date.now()
    };
    // 1. Save to LocalStorage:
    // We use localStorage because it is purely synchronous. This allows loadProgress() 
    // to instantly return the starting sentence index when a user hits "Play". 
    // This is strictly required because browsers (especially Safari) will block TTS 
    // audio if window.speechSynthesis.speak() isn't called synchronously inside the user's click event.
    try {
      localStorage.setItem(`tts_progress_${currentKeyRef.current}`, JSON.stringify(progressData));
    } catch (e) {
      console.warn('Failed to save TTS progress to localStorage:', e);
    }

    // 2. Save to IndexedDB (Metadata Store):
    // We backup to IndexedDB so this data is available to background processes. 
    // This will be extremely useful later for syncing playback progress to the server
    // or rendering accurate global progress bars without blocking the main UI thread.
    setMetadata(`tts_progress_${currentKeyRef.current}`, progressData);
  }, [currentKeyRef]);

  const loadProgress = useCallback((key: string, totalChars: number, chunks: TTSChunk[]): number => {
    // Note: We intentionally ONLY read from localStorage here.
    // Making an async read to IndexedDB here would force the entire trigger flow to become async,
    // which causes browsers to lose the "user gesture" context and block the audio autoplay.
    try {
      const savedStr = localStorage.getItem(`tts_progress_${key}`);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && saved.offset !== undefined && saved.offset < totalChars - 100) {
          const offset = saved.offset;
          const sentenceIndex = chunks.findIndex((c, i) => {
            const next = chunks[i + 1];
            return next ? offset < next.startOffset : true;
          });
          if (sentenceIndex >= 0) {
            return sentenceIndex;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load TTS progress from localStorage:', e);
    }
    return 0;
  }, []);

  return { chunkCharOffsetRef, currentChunkIndexRef, saveProgress, loadProgress };
}
