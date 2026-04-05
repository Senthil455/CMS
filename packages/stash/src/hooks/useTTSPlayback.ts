import { useRef, useCallback, useEffect } from 'react';
import { TTSChunk } from './useTTSContent';

export interface UseTTSPlaybackOptions {
  // Sub-hooks
  prepareChunks: (html: string) => { totalChars: number; chunks: TTSChunk[] };
  saveProgress: (chunks: TTSChunk[]) => void;
  loadProgress: (key: string, totalChars: number, chunks: TTSChunk[]) => number;
  chunksRef: React.MutableRefObject<TTSChunk[]>;
  chunkCharOffsetRef: React.MutableRefObject<number>;
  currentChunkIndexRef: React.MutableRefObject<number>;
  totalCharsRef: React.MutableRefObject<number>;
  currentKeyRef: React.MutableRefObject<string | null>;
  // Engine
  playStateRef: React.MutableRefObject<'playing' | 'paused' | 'stopped'>;
  utteranceRef: React.MutableRefObject<SpeechSynthesisUtterance | null>;
  speakCurrentChunk: () => void;
  // State updater — accepts any subset of the TTS state shape
  // Using Record<string, unknown> avoids a circular import with useSpeechSynthesis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateState: (s: Record<string, any>) => void;
}

export function useTTSPlayback(options: UseTTSPlaybackOptions) {
  const {
    prepareChunks, saveProgress, loadProgress,
    chunksRef, chunkCharOffsetRef, currentChunkIndexRef, totalCharsRef, currentKeyRef,
    playStateRef, utteranceRef, speakCurrentChunk,
    updateState,
  } = options;

  const play = useCallback(async (
    htmlContent: string,
    key: string,
    resumeProgress: boolean = true,
    autoPlay: boolean = true,
  ) => {
    const isSameKey = currentKeyRef.current === key;
    const isAlreadyPlaying = playStateRef.current === 'playing';

    // Same item, autoPlay (user clicked Play icon) → toggle play/pause state
    if (isSameKey && autoPlay) {
      if (isAlreadyPlaying) {
        // Toggle to paused
        playStateRef.current = 'paused';
        window.speechSynthesis.pause();
        saveProgress(chunksRef.current);
        updateState({ isPlaying: false, isPaused: true });
        return;
      } else if (playStateRef.current === 'paused') {
        // Toggle to playing (resume)
        playStateRef.current = 'playing';
        if (!utteranceRef.current) speakCurrentChunk();
        else window.speechSynthesis.resume();
        updateState({ isPlaying: true, isPaused: false });
        return;
      }
      // If stopped, fall through to regenerate chunks & restart
    }

    // Same item, no autoPlay → prepare chunks but don't restart
    if (isSameKey && !autoPlay) {
      const { totalChars, chunks } = prepareChunks(htmlContent);
      totalCharsRef.current = totalChars;
      updateState({ totalChars, chunks });
      return;
    }

    // Switching to a different item — save current progress first
    if (!isSameKey && currentKeyRef.current) {
      saveProgress(chunksRef.current);
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    currentKeyRef.current = key;
    playStateRef.current = autoPlay ? 'playing' : 'paused';
    chunkCharOffsetRef.current = 0;

    const { totalChars, chunks } = prepareChunks(htmlContent);
    totalCharsRef.current = totalChars;
    updateState({ totalChars, progress: 0, currentCharIndex: 0, chunks, currentChunkIndex: 0, error: null });
    currentChunkIndexRef.current = 0;

    if (resumeProgress) {
      const sentenceIndex = loadProgress(key, totalChars, chunks);
      currentChunkIndexRef.current = sentenceIndex;
      updateState({ currentChunkIndex: sentenceIndex });
    }

    if (chunks.length > 0) {
      if (autoPlay) {
        speakCurrentChunk();
        updateState({ isPlaying: true, isPaused: false });
      } else {
        updateState({ isPlaying: false, isPaused: true });
      }
    } else {
      playStateRef.current = 'stopped';
      updateState({ isPlaying: false, isPaused: false });
    }
  }, [
    prepareChunks, saveProgress, loadProgress,
    chunksRef, chunkCharOffsetRef, currentChunkIndexRef, totalCharsRef,
    playStateRef, utteranceRef, speakCurrentChunk, updateState,
  ]);

  const pause = useCallback(() => {
    playStateRef.current = 'paused';
    window.speechSynthesis.pause();
    saveProgress(chunksRef.current);
    updateState({ isPlaying: false, isPaused: true });
  }, [playStateRef, saveProgress, chunksRef, updateState]);

  const resume = useCallback(() => {
    playStateRef.current = 'playing';
    if (!utteranceRef.current) {
      speakCurrentChunk();
    } else {
      window.speechSynthesis.resume();
    }
    updateState({ isPlaying: true, isPaused: false });
  }, [playStateRef, utteranceRef, speakCurrentChunk, updateState]);

  const seek = useCallback((chunkIndex: number) => {
    if (!chunksRef.current || chunksRef.current.length === 0) return;
    if (chunkIndex < 0 || chunkIndex >= chunksRef.current.length) return;
    window.speechSynthesis.cancel();
    currentChunkIndexRef.current = chunkIndex;
    chunkCharOffsetRef.current = 0;
    playStateRef.current = 'playing';
    speakCurrentChunk();
    updateState({ currentChunkIndex: chunkIndex, isPlaying: true, isPaused: false });
  }, [chunksRef, currentChunkIndexRef, chunkCharOffsetRef, playStateRef, speakCurrentChunk, updateState]);

  // Save progress & cancel on unmount
  useEffect(() => {
    return () => {
      saveProgress(chunksRef.current);
      window.speechSynthesis.cancel();
    };
  }, [saveProgress, chunksRef]);

  return { play, pause, resume, seek };
}
