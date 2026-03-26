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
    
    try {
      localStorage.setItem(`tts_progress_${currentKeyRef.current}`, JSON.stringify(progressData));
    } catch (e) {
      console.warn('Failed to save TTS progress to localStorage:', e);
    }
    
    setMetadata(`tts_progress_${currentKeyRef.current}`, progressData);
  }, [currentKeyRef]);

  const loadProgress = useCallback((key: string, totalChars: number, chunks: TTSChunk[]): number => {
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
