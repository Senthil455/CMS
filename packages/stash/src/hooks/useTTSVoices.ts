import { useState, useEffect, useRef, useCallback } from 'react';

const preferredZh = ['Meijia', 'Mei-Jia', 'Sin-ji', 'Ting-Ting', 'Yu-shu', 'Yu-Shu'];
const preferredEn = ['Daniel', 'Samantha', 'Karen', 'Google', 'Natural', 'Premium', 'Enhanced'];

export function useTTSVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voicesCacheRef = useRef<SpeechSynthesisVoice[]>([]);

  const pickVoice = useCallback((voices: SpeechSynthesisVoice[], lang?: string) => {
    const targetLang = (lang || 'en').toLowerCase();
    const isZh = targetLang.startsWith('zh') || targetLang.startsWith('cn');
    const isEn = targetLang.startsWith('en');

    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetLang));
    const candidates = langVoices.length > 0 ? langVoices : voices;

    if (isZh) {
      for (const name of preferredZh) {
        const v = candidates.find(v => v.name.includes(name));
        if (v) return v;
      }
      return null;
    }

    if (isEn) {
      for (const name of preferredEn) {
        const v = candidates.find(v => v.name.includes(name));
        if (v) return v;
      }
      return null;
    }

    return candidates[0] || voices[0] || null;
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      let voices = window.speechSynthesis.getVoices();

      voicesCacheRef.current = voices;
      setVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  return { voices, voicesCacheRef, pickVoice };
}
