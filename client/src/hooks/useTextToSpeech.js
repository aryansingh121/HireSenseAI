import { useCallback, useEffect, useState, useRef } from "react";

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const processQueue = useCallback(() => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const { text, onComplete } = queueRef.current.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const preferredVoice = voices.find(
      (v) => v.name.includes("Google US English") || (v.lang === "en-US" && v.name.includes("Female"))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else if (voices.length > 0) {
      utterance.voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      isPlayingRef.current = false;
      if (onComplete) onComplete();
      
      if (queueRef.current.length === 0) {
        setIsSpeaking(false);
      } else {
        processQueue();
      }
    };

    utterance.onerror = (e) => {
      console.error("[TTS] Error:", e);
      isPlayingRef.current = false;
      if (onComplete) onComplete();
      
      if (queueRef.current.length === 0) {
        setIsSpeaking(false);
      } else {
        processQueue();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const speak = useCallback((text, onComplete) => {
    if (!text || text.trim() === "") {
      if (onComplete) onComplete();
      return;
    }

    queueRef.current.push({ text, onComplete });
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    queueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
