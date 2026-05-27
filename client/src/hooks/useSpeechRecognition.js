import { useEffect, useMemo, useRef, useState } from "react";

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const intendedListeningRef = useRef(false);

  const supported = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  useEffect(() => {
    if (!supported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("[MIC STATE] Speech recognition started natively.");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      console.log("[MIC STATE] Speech detected:", text);
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      console.error("[MIC STATE] Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // Ignore no-speech errors, we rely on VAD
      } else {
        setError(event.error || "Speech recognition failed");
      }
    };

    recognition.onend = () => {
      console.log("[MIC STATE] Speech recognition ended natively.");
      setIsListening(false);
      // Failsafe auto-recovery: If we are SUPPOSED to be listening, immediately restart!
      if (intendedListeningRef.current) {
        console.log("[MIC STATE] Auto-recovering microphone stream...");
        try {
          recognition.start();
        } catch (err) {
          console.warn("[MIC STATE] Ignored recovery start error", err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      intendedListeningRef.current = false;
      recognition.stop();
    };
  }, [supported]);

  function start() {
    setError("");
    intendedListeningRef.current = true;
    if (!recognitionRef.current) {
      setError("Speech recognition is not available in this browser");
      return;
    }
    if (isListening) return; // SAFEGUARD: Prevent duplicate starts
    
    console.log("[MIC STATE] Requesting mic start...");
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn("[MIC STATE] Ignored SpeechRecognition start error:", err);
    }
  }

  function stop() {
    console.log("[MIC STATE] Requesting mic stop...");
    intendedListeningRef.current = false;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (err) {
      console.warn("[MIC STATE] Ignored SpeechRecognition stop error:", err);
    }
    setIsListening(false);
  }

  function reset() {
    setTranscript("");
    setError("");
  }

  return { error, isListening, reset, start, stop, supported, transcript };
}
