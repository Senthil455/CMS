import { useState, useRef, useCallback } from 'react';

export function useTTSSettings() {
  const [rate, setRateState] = useState(1);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);

  const rateRef = useRef(1);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const setRate = useCallback((newRate: number, onRestart?: () => void) => {
    rateRef.current = newRate;
    setRateState(newRate);
    onRestart?.();
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice, onRestart?: () => void) => {
    selectedVoiceRef.current = voice;
    setSelectedVoiceState(voice);
    onRestart?.();
  }, []);

  return { rate, selectedVoice, rateRef, selectedVoiceRef, setRate, setVoice };
}
