/**
 * Speak instead of type (BRDC-BUGREPORT-001).
 *
 * `SpeechRecognition` is a Chrome/Android thing — it does the transcript on-device and
 * hands back text. iOS Safari has no such API, so `supported` is false there and the
 * caller shows only the textarea. One utterance at a time; the result is appended.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechResultLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechResultLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useDictation(onChunk: (text: string) => void): {
  supported: boolean;
  listening: boolean;
  toggle: () => void;
} {
  const Recognition = ctor();
  const ref = useRef<RecognitionLike | null>(null);
  const [listening, setListening] = useState(false);

  useEffect(
    () => () => {
      ref.current?.stop();
      ref.current = null;
    },
    [],
  );

  const toggle = useCallback(() => {
    if (!Recognition) return;
    if (ref.current) {
      ref.current.stop();
      return;
    }
    const rec = new Recognition();
    rec.lang = navigator.language || 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? '';
      if (said) onChunk(said);
    };
    rec.onend = () => {
      ref.current = null;
      setListening(false);
    };
    rec.onerror = () => {
      ref.current = null;
      setListening(false);
    };
    ref.current = rec;
    setListening(true);
    rec.start();
  }, [Recognition, onChunk]);

  return { supported: Recognition !== null, listening, toggle };
}
