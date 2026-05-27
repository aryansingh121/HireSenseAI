import { useCallback, useEffect, useState, useRef } from "react";

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  
  const speechQueueRef = useRef([]);
  const isCurrentlySpeakingRef = useRef(false);
  const startTimeoutRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stop();
    };
  }, []);

  const processQueue = useCallback(() => {
    if (isCurrentlySpeakingRef.current || speechQueueRef.current.length === 0) {
      if (speechQueueRef.current.length === 0 && isCurrentlySpeakingRef.current === false) {
        setIsSpeaking(false);
      }
      return;
    }

    isCurrentlySpeakingRef.current = true;
    setIsSpeaking(true);

    const chunk = speechQueueRef.current.shift();
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Microsoft"))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.05; // Slightly faster for conversational realism
    utterance.pitch = 1.0;

    startTimeoutRef.current = setTimeout(() => {
      console.warn("Speech synthesis blocked or timed out. Bypassing chunk.");
      isCurrentlySpeakingRef.current = false;
      processQueue();
    }, 3000);

    utterance.onstart = () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    };

    utterance.onend = () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      isCurrentlySpeakingRef.current = false;
      if (chunk.onEnd) chunk.onEnd();
      processQueue(); // Automatically play next chunk in queue
    };

    utterance.onerror = (e) => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      console.error("SpeechSynthesis error:", e);
      isCurrentlySpeakingRef.current = false;
      processQueue();
    };

    // Store globally to prevent Chrome garbage collection bug
    window._utterances = window._utterances || [];
    window._utterances.push(utterance);
    
    // Clean up old utterances
    if (window._utterances.length > 5) {
      window._utterances.shift();
    }

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const queueSpeech = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) return;
    if (!text || text.trim() === "") return;

    speechQueueRef.current.push({ text, onEnd });
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      speechQueueRef.current = [];
      isCurrentlySpeakingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  return { isSpeaking, queueSpeech, stop, voices };
}
