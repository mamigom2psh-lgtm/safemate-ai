import { useCallback, useEffect, useRef, useState } from 'react';

function speechAvailable(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window;
}

export function useSpeechCoach() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => setSupported(speechAvailable()), []);

  const speak = useCallback((message: string) => {
    if (!enabledRef.current || !speechAvailable()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.96;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggle = useCallback((activationMessage: string) => {
    if (!speechAvailable()) {
      setSupported(false);
      return;
    }
    const nextEnabled = !enabledRef.current;
    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);
    window.speechSynthesis.cancel();
    if (!nextEnabled) return;

    const utterance = new SpeechSynthesisUtterance(activationMessage);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => () => {
    if (speechAvailable()) window.speechSynthesis.cancel();
  }, []);

  return { supported, enabled, speak, toggle };
}
