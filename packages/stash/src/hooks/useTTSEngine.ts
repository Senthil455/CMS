import { useRef, useCallback } from 'react';
import { TTSChunk } from './useTTSContent';

export interface TTSEngineCallbacks {
  onProgress: (currentCharIndex: number, progress: number) => void;
  onChunkEnd: (nextChunkIndex: number) => void;
  onFinished: () => void;
  onError: (message: string) => void;
  onSaveProgress: () => void;
  getChunks: () => TTSChunk[];
  getCurrentChunkIndex: () => number;
  setChunkCharOffset: (offset: number) => void;
  getTotalChars: () => number;
  getRate: () => number;
  getSelectedVoice: () => SpeechSynthesisVoice | null;
  pickVoice: (voices: SpeechSynthesisVoice[], lang?: string) => SpeechSynthesisVoice | null;
  getVoicesCache: () => SpeechSynthesisVoice[];
  detectLang: (text: string) => string;
}

export function useTTSEngine(callbacks: TTSEngineCallbacks) {
  const playStateRef = useRef<'playing' | 'paused' | 'stopped'>('stopped');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakCurrentChunk = useCallback(() => {
    if (playStateRef.current !== 'playing') return;

    window.speechSynthesis.cancel();

    const chunks = callbacks.getChunks();
    const currentChunkIndex = callbacks.getCurrentChunkIndex();
    const chunk = chunks[currentChunkIndex];
    if (!chunk) return;

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = callbacks.getRate();

    const detectedLang = chunk.lang || callbacks.detectLang(chunk.text);
    const voice = callbacks.getSelectedVoice() || callbacks.pickVoice(callbacks.getVoicesCache(), detectedLang);
    if (voice) utterance.voice = voice;
    utteranceRef.current = utterance;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        callbacks.setChunkCharOffset(event.charIndex);
        const globalOffset = chunk.startOffset + event.charIndex;
        if (event.charIndex % 20 === 0) {
          const totalChars = callbacks.getTotalChars();
          callbacks.onProgress(globalOffset, totalChars > 0 ? globalOffset / totalChars : 0);
          if (event.charIndex % 100 === 0) callbacks.onSaveProgress();
        }
      }
    };

    utterance.onend = () => {
      setTimeout(() => {
        if (playStateRef.current !== 'playing') return;
        const nextIndex = callbacks.getCurrentChunkIndex() + 1;
        if (nextIndex >= callbacks.getChunks().length) {
          playStateRef.current = 'stopped';
          callbacks.onFinished();
          callbacks.onSaveProgress();
          return;
        }
        callbacks.setChunkCharOffset(0);
        callbacks.onChunkEnd(nextIndex);
        speakCurrentChunk();
      }, 50);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('Speech synthesis error:', e);
        playStateRef.current = 'stopped';
        callbacks.onError(`Speech synthesis error: ${e.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [callbacks]);

  return { playStateRef, utteranceRef, speakCurrentChunk };
}
