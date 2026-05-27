import { useRef, useEffect } from "react";
import useInterviewStore, { INTERVIEW_STATES } from "../store/useInterviewStore.js";

export default function useVoiceActivityDetection(onInterruptionDetected, onSilenceDetected) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Directly subscribe to Zustand state to avoid React stale closures in the requestAnimationFrame loop
  const getStore = useInterviewStore.getState;

  // Configuration
  const VOLUME_THRESHOLD = 0.05; // 0.0 to 1.0 (Adjust sensitivity here)
  const INTERRUPTION_DEBOUNCE_MS = 300; // Must sustain loud noise for 300ms to interrupt
  const SILENCE_DEBOUNCE_MS = 1500; // Wait 1.5 seconds of silence before auto-submitting
  const SPEECH_DEBOUNCE_MS = 400; // Must sustain noise for 400ms to be considered "intentional speech" (filters out keyboard clicks)
  
  const loudTimeRef = useRef(0);
  const speakingTimeRef = useRef(0);
  const silenceTimeRef = useRef(0);
  const hasSpokenRef = useRef(false);

  const onInterruptionDetectedRef = useRef(onInterruptionDetected);
  const onSilenceDetectedRef = useRef(onSilenceDetected);

  useEffect(() => {
    onInterruptionDetectedRef.current = onInterruptionDetected;
    onSilenceDetectedRef.current = onSilenceDetected;
  }, [onInterruptionDetected, onSilenceDetected]);

  useEffect(() => {
    return () => stopVAD();
  }, []);

  const monitorVolume = (lastTime) => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const averageVolume = sum / dataArray.length / 255.0;

    const currentTime = performance.now();
    const delta = currentTime - lastTime;
    
    // Read directly from Zustand store
    const { status, setVadState } = getStore();
    const isAISpeaking = status === INTERVIEW_STATES.SPEAKING || status === INTERVIEW_STATES.PROCESSING || status === INTERVIEW_STATES.THINKING || status === INTERVIEW_STATES.AI_STREAMING;
    const isListening = status === INTERVIEW_STATES.LISTENING;

    if (averageVolume > VOLUME_THRESHOLD) {
      // Noise detected
      if (isAISpeaking) {
        // Interruption tracking
        loudTimeRef.current += delta;
        if (loudTimeRef.current >= INTERRUPTION_DEBOUNCE_MS) {
          console.log("[VAD] Interruption confirmed!");
          loudTimeRef.current = 0;
          if (onInterruptionDetectedRef.current) onInterruptionDetectedRef.current();
        }
      } else if (isListening) {
        // Speaking tracking
        speakingTimeRef.current += delta;
        
        // Only classify as "hasSpoken" if they sustain it longer than a keyboard click
        if (speakingTimeRef.current >= SPEECH_DEBOUNCE_MS && !hasSpokenRef.current) {
          console.log("[VAD] Intentional speech started...");
          hasSpokenRef.current = true;
          setVadState('speaking');
        }
        silenceTimeRef.current = 0;
      }
    } else {
      // Silence detected
      loudTimeRef.current = 0;
      speakingTimeRef.current = 0;
      
      if (isListening && hasSpokenRef.current) {
        silenceTimeRef.current += delta;
        if (silenceTimeRef.current >= SILENCE_DEBOUNCE_MS) {
          console.log("[VAD] Silence threshold reached. User stopped speaking.");
          silenceTimeRef.current = 0;
          hasSpokenRef.current = false;
          setVadState('silent');
          if (onSilenceDetectedRef.current) onSilenceDetectedRef.current();
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(() => monitorVolume(currentTime));
  };

  const startVAD = async () => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
         audioContextRef.current = new AudioContext();
      } else if (audioContextRef.current.state === "suspended") {
         await audioContextRef.current.resume();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      if (!sourceRef.current) {
        sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
        sourceRef.current.connect(analyserRef.current);
      }

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      const startTime = performance.now();
      monitorVolume(startTime);
    } catch (err) {
      console.warn("VAD Start Error:", err);
    }
  };

  const stopVAD = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    loudTimeRef.current = 0;
    speakingTimeRef.current = 0;
    silenceTimeRef.current = 0;
    hasSpokenRef.current = false;
    getStore().setVadState('silent');
  };

  return { startVAD, stopVAD };
}
