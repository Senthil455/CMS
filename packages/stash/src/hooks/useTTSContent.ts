import { useRef, useCallback } from 'react';

export interface TTSChunk {
  text: string;
  startOffset: number;
  lang?: string;
}

export function useTTSContent() {
  const chunksRef = useRef<TTSChunk[]>([]);

  const detectLang = useCallback((text: string): string => {
    const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
    return hasChinese ? 'zh' : 'en';
  }, []);

  const prepareChunks = useCallback((htmlContent: string) => {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const text = doc.body.textContent || '';

    const sentenceMatches = text.match(/[^.!?：；。！？\n]+[.!?：；。！？\n]+|[^.!?：；。！？\n]+$/g) || [text];
    const chunks: TTSChunk[] = [];
    let offset = 0;

    for (const raw of sentenceMatches) {
      const trimmed = raw.trim();
      if (trimmed) {
        chunks.push({
          text: raw,
          startOffset: offset,
          lang: detectLang(raw),
        });
      }
      offset += raw.length;
    }

    chunksRef.current = chunks;
    return { totalChars: text.length, chunks };
  }, [detectLang]);

  return { chunksRef, prepareChunks, detectLang };
}
