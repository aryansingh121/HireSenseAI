import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useInterviewStore, { INTERVIEW_STATES } from "../store/useInterviewStore.js";

export default function useSpeechRecognition(onSpeechComplete) {
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const lastTranscriptRef = useRef("");
  const restartAttemptsRef = useRef(0);
  
  const { setMicActive, setCandidateTranscript } = useInterviewStore();

  const supported = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (err) {}
  }, []);

  const stop = useCallback(() => {
    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch (err) {}
    setMicActive(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [setMicActive]);

  useEffect(() => {
    if (!supported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("[MIC] Started natively.");
      setMicActive(true);
    };

    recognition.onresult = (event) => {
      const state = useInterviewStore.getState();
      if (state.status !== INTERVIEW_STATES.LISTENING) return;

      const results = Array.from(event.results);
      
      // Filter out low confidence noise
      const validResults = results.filter(result => result[0].confidence > 0.3);
      if (validResults.length === 0) return;

      const text = validResults
        .map((result) => result[0].transcript)
        .join(" ");
        
      setCandidateTranscript(text);
      lastTranscriptRef.current = text;
      
      // Reset restart attempts since we successfully got audio
      restartAttemptsRef.current = 0;

      // Reset the silence timer every time we hear new words
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(() => {
        // Only trigger if we are still strictly listening
        const currentStatus = useInterviewStore.getState().status;
        if (currentStatus === INTERVIEW_STATES.LISTENING) {
          const finalTranscript = lastTranscriptRef.current;
          if (finalTranscript && finalTranscript.trim().length > 2) {
            console.log("[MIC] Silence timeout reached. Submitting:", finalTranscript);
            if (onSpeechComplete) onSpeechComplete(finalTranscript);
          }
        }
      }, 2000); // Wait 2 seconds after they stop talking
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.error("[MIC] Error:", event.error);
      }
    };

    recognition.onend = () => {
      console.log("[MIC] Ended natively.");
      setMicActive(false);
      
      // Auto-restart if we are still supposed to be listening
      const currentStatus = useInterviewStore.getState().status;
      if (currentStatus === INTERVIEW_STATES.LISTENING) {
        restartAttemptsRef.current += 1;
        
        if (restartAttemptsRef.current > 5) {
          console.error("[MIC] Max restart attempts reached. Halting auto-restart to prevent infinite loops.");
          return;
        }

        const backoffMs = Math.min(500 * restartAttemptsRef.current, 2000);
        setTimeout(() => {
          const freshStatus = useInterviewStore.getState().status;
          if (freshStatus === INTERVIEW_STATES.LISTENING) {
            try {
              recognition.start();
            } catch (err) {}
          }
        }, backoffMs);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [supported, setMicActive, setCandidateTranscript, onSpeechComplete]);

  return { start, stop, supported };
}
