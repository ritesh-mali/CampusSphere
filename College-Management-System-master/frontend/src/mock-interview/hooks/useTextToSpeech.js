import { useCallback, useRef, useState } from "react";

export const useTextToSpeech = () => {
  const utteranceRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(
    (text, { rate = 0.92, pitch = 1, onEnd } = {}) => {
      if (!window.speechSynthesis || !text?.trim()) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /google uk english female|samantha|zira|female/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, cancel, isSpeaking };
};
