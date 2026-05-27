import { useCallback, useEffect, useState } from "react";

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text, onEnd) => {
      if (!window.speechSynthesis) {
        console.warn("SpeechSynthesis API not supported");
        if (onEnd) onEnd();
        return;
      }

      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha"))
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      let startTimeout = setTimeout(() => {
        console.warn("Speech synthesis blocked or timed out. Bypassing.");
        window._utterances = window._utterances.filter(u => u !== utterance);
        setIsSpeaking(false);
        if (onEnd) onEnd();
      }, 3000);

      utterance.onstart = () => {
        clearTimeout(startTimeout);
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        clearTimeout(startTimeout);
        setIsSpeaking(false);
        // Clear reference to prevent memory leaks
        window._utterances = window._utterances.filter(u => u !== utterance);
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        clearTimeout(startTimeout);
        console.error("SpeechSynthesis error:", e);
        setIsSpeaking(false);
        window._utterances = window._utterances.filter(u => u !== utterance);
        if (onEnd) onEnd();
      };

      // Store in global scope to prevent Chrome garbage collection bug
      window._utterances = window._utterances || [];
      window._utterances.push(utterance);

      window.speechSynthesis.speak(utterance);
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isSpeaking, speak, stop, voices };
}
