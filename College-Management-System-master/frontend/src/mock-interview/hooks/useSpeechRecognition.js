import { useCallback, useRef, useState } from "react";

/**
 * Web Speech API hook — avoids duplicate text by:
 * - accumulating only isFinal segments once
 * - treating interim text as a replaceable suffix (not appended each event)
 */
export const useSpeechRecognition = ({ onTranscript, lang = "en-US" } = {}) => {
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const finalsRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  const resetSession = useCallback(() => {
    finalsRef.current = "";
  }, []);

  const start = useCallback(() => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    finalsRef.current = "";

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";
        if (!text) continue;

        if (result.isFinal) {
          finalsRef.current += text;
        } else {
          interim += text;
        }
      }

      const sessionText = `${finalsRef.current}${interim}`.trim();
      if (sessionText && onTranscript) {
        onTranscript(sessionText);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!shouldListenRef.current) {
        setIsListening(false);
        return;
      }
      try {
        recognition.start();
      } catch {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      shouldListenRef.current = false;
      setIsListening(false);
    }
  }, [lang, onTranscript]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    finalsRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { start, stop, isListening, supported, resetSession };
};
