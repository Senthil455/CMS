import { useState, useRef, useCallback, useEffect } from 'react';
import { useTTSVoices } from './useTTSVoices';
import { useTTSContent, TTSChunk } from './useTTSContent';
import { useTTSProgress } from './useTTSProgress';
import { useTTSSettings } from './useTTSSettings';
import { useTTSEngine } from './useTTSEngine';
import { useTTSPlayback } from './useTTSPlayback';

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

  const updateState = useCallback((newState: Partial<TTSState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []);

  // — Sub-hooks —
  const { voices, voicesCacheRef, pickVoice } = useTTSVoices();
  const { chunksRef, prepareChunks, detectLang } = useTTSContent();
  const { rate, selectedVoice, rateRef, selectedVoiceRef, setRate: setRateBase, setVoice: setVoiceBase } = useTTSSettings();

  // Shared refs consumed by the engine and playback hooks
  const currentChunkIndexRef = useRef(0);
  const chunkCharOffsetRef = useRef(0);
  const totalCharsRef = useRef(0);

  // currentKeyRef lives in useTTSPlayback, but useTTSProgress needs it
  const currentKeyRef = useRef<string | null>(null);
  const { saveProgress, loadProgress } = useTTSProgress(currentKeyRef);

  // Engine — utterance lifecycle
  const { playStateRef, utteranceRef, speakCurrentChunk } = useTTSEngine({
    onProgress: (currentCharIndex, progress) => updateState({ currentCharIndex, progress }),
    onChunkEnd: (nextChunkIndex) => {
      currentChunkIndexRef.current = nextChunkIndex;
      updateState({ currentChunkIndex: nextChunkIndex });
    },
    onFinished: () => updateState({ isPlaying: false, isPaused: false, progress: 1 }),
    onError: (message) => updateState({ isPlaying: false, isPaused: false, error: message }),
    onSaveProgress: () => saveProgress(chunksRef.current),
    getChunks: () => chunksRef.current,
    getCurrentChunkIndex: () => currentChunkIndexRef.current,
    setChunkCharOffset: (offset) => { chunkCharOffsetRef.current = offset; },
    getTotalChars: () => totalCharsRef.current,
    getRate: () => rateRef.current,
    getSelectedVoice: () => selectedVoiceRef.current,
    pickVoice,
    getVoicesCache: () => voicesCacheRef.current,
    detectLang,
  });

  // Playback orchestration
  const { play, pause, resume, seek } = useTTSPlayback({
    prepareChunks,
    saveProgress,
    loadProgress,
    chunksRef,
    chunkCharOffsetRef,
    currentChunkIndexRef,
    totalCharsRef,
    playStateRef,
    utteranceRef,
    speakCurrentChunk,
    updateState,
  });

  // Sync voices to state
  useEffect(() => {
    updateState({ voices });
  }, [voices, updateState]);

  // Sync settings to state
  useEffect(() => {
    updateState({ rate });
  }, [rate, updateState]);

  useEffect(() => {
    updateState({ selectedVoice });
  }, [selectedVoice, updateState]);

  const setRate = (newRate: number) => {
    setRateBase(newRate, () => {
      if (playStateRef.current === 'playing') {
        window.speechSynthesis.cancel();
        speakCurrentChunk();
      }
    });
  };

  const setVoice = (voice: SpeechSynthesisVoice) => {
    setVoiceBase(voice, () => {
      if (playStateRef.current === 'playing') {
        window.speechSynthesis.cancel();
        speakCurrentChunk();
      }
    });
  };

  return {
    ...state,
    play,
    pause,
    resume,
    seek,
    setRate,
    setVoice,
  };
}
