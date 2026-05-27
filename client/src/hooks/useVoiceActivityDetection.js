import { useRef, useEffect } from "react";

export default function useVoiceActivityDetection(onInterruptionDetected, onSilenceDetected) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isAISpeakingRef = useRef(false);
  const isListeningRef = useRef(false);

  // Configuration
  const VOLUME_THRESHOLD = 0.05; // 0.0 to 1.0 (Adjust sensitivity here)
  const INTERRUPTION_DEBOUNCE_MS = 300; // Must sustain loud noise for 300ms to interrupt
  const SILENCE_DEBOUNCE_MS = 1500; // Wait 1.5 seconds of silence before auto-submitting
  const loudTimeRef = useRef(0);
  const silenceTimeRef = useRef(0);
  const hasSpokenRef = useRef(false);

  const onInterruptionDetectedRef = useRef(onInterruptionDetected);
  const onSilenceDetectedRef = useRef(onSilenceDetected);

  useEffect(() => {
    onInterruptionDetectedRef.current = onInterruptionDetected;
    onSilenceDetectedRef.current = onSilenceDetected;
  }, [onInterruptionDetected, onSilenceDetected]);

  // External control to notify VAD when AI is currently speaking
  const setAISpeakingState = (isSpeaking) => {
    isAISpeakingRef.current = isSpeaking;
  };
  
  const setListeningState = (isListening) => {
    isListeningRef.current = isListening;
    if (!isListening) {
       hasSpokenRef.current = false;
       silenceTimeRef.current = 0;
    }
  };

  useEffect(() => {
    return () => {
      stopVAD();
    };
  }, []);

  const startVAD = async () => {
    if (audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let lastFrameTime = performance.now();

      const monitorVolume = (time) => {
        const delta = time - lastFrameTime;
        lastFrameTime = time;

        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const averageVolume = (sum / dataArray.length) / 255.0;

          // Detect loud human speech
          if (averageVolume > VOLUME_THRESHOLD) {
            // Only care about this if AI is currently speaking
            if (isAISpeakingRef.current) {
              loudTimeRef.current += delta;
              
              if (loudTimeRef.current >= INTERRUPTION_DEBOUNCE_MS) {
                // Interruption confirmed!
                console.log("[VAD STATE] Interruption detected!");
                loudTimeRef.current = 0;
                if (onInterruptionDetectedRef.current) {
                  onInterruptionDetectedRef.current();
                }
              }
            } else if (isListeningRef.current) {
              // User is speaking while we are listening
              if (!hasSpokenRef.current) {
                console.log("[VAD STATE] User started speaking...");
              }
              hasSpokenRef.current = true;
              silenceTimeRef.current = 0;
            }
          } else {
            loudTimeRef.current = 0;
            
            // If we are listening and the user has spoken, start counting silence
            if (isListeningRef.current && hasSpokenRef.current) {
              silenceTimeRef.current += delta;
              if (silenceTimeRef.current >= SILENCE_DEBOUNCE_MS) {
                // User has finished speaking!
                console.log("[VAD STATE] User stopped speaking (silence detected).");
                silenceTimeRef.current = 0;
                hasSpokenRef.current = false;
                if (onSilenceDetectedRef.current) {
                  onSilenceDetectedRef.current();
                }
              }
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(monitorVolume);
      };

      animationFrameRef.current = requestAnimationFrame(monitorVolume);

    } catch (err) {
      console.warn("VAD failed to access microphone", err);
    }
  };

  const stopVAD = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  return { startVAD, stopVAD, setAISpeakingState, setListeningState };
}
