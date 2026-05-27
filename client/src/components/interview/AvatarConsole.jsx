import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import * as faceapi from "face-api.js";
import { io } from "socket.io-client";
import useSpeechRecognition from "../../hooks/useSpeechRecognition.js";
import useTextToSpeech from "../../hooks/useTextToSpeech.js";
import useVoiceActivityDetection from "../../hooks/useVoiceActivityDetection.js";
import AvatarModel from "./AvatarModel.jsx";
import { useInterview, INTERVIEW_STATES } from "../../context/InterviewContext.jsx";

const MODEL_URL = "https://unpkg.com/@vladmandic/face-api/model";
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AvatarConsole({ session, onEnd }) {
  const { 
    status, setStatus, 
    currentQuestion, setQuestion, 
    aiTranscript, setAiTranscript,
    confidenceScore, setConfidenceScore 
  } = useInterview();

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  
  // Use refs to avoid stale closures in socket/VAD callbacks
  const statusRef = useRef(status);
  const currentSentenceRef = useRef("");
  const fullTranscriptRef = useRef("");

  // Keep statusRef always in sync
  useEffect(() => {
    statusRef.current = status;
    console.log(`[STATE] → ${status}`);
  }, [status]);

  const { isListening, transcript, start: startListening, stop: stopListening, reset: resetTranscript } = useSpeechRecognition();
  const { isSpeaking, queueSpeech, stop: stopSpeaking } = useTextToSpeech();
  
  // Keep transcript in a ref so VAD silence callback can always read the latest value
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  
  // ── VAD Callbacks (use refs to avoid stale closures) ──

  const handleInterruption = useCallback(() => {
    const s = statusRef.current;
    if (s !== INTERVIEW_STATES.SPEAKING && s !== INTERVIEW_STATES.PROCESSING) return;
    
    console.log("[VAD] Interruption detected! Stopping AI speech.");
    stopSpeaking();
    currentSentenceRef.current = "";
    if (socketRef.current) socketRef.current.emit("user_speaking");
    
    setStatus(INTERVIEW_STATES.INTERRUPTED);
    setTimeout(() => {
      if (mountedRef.current) setStatus(INTERVIEW_STATES.LISTENING);
    }, 500);
  }, [stopSpeaking, setStatus]);

  const handleSilence = useCallback(() => {
    const s = statusRef.current;
    if (s !== INTERVIEW_STATES.LISTENING || !mountedRef.current) return;
    
    const finalTranscript = transcriptRef.current;
    if (!finalTranscript || finalTranscript.trim().length < 2) {
      console.warn("[VAD] Silence detected but transcript empty/short. Ignoring.");
      return;
    }
    
    console.log(`[VAD] Silence auto-submit: "${finalTranscript}"`);
    
    setStatus(INTERVIEW_STATES.THINKING);
    fullTranscriptRef.current = "";
    
    if (socketRef.current) {
      socketRef.current.emit("user_stopped", { transcript: finalTranscript });
    }
    resetTranscript();
  }, [setStatus, resetTranscript]);

  const { startVAD, stopVAD, setAISpeakingState, setListeningState } = useVoiceActivityDetection(handleInterruption, handleSilence);

  // Sync VAD awareness with status changes
  useEffect(() => {
    const speaking = status === INTERVIEW_STATES.SPEAKING || status === INTERVIEW_STATES.PROCESSING;
    const listening = status === INTERVIEW_STATES.LISTENING;
    setAISpeakingState(speaking);
    setListeningState(listening);
  }, [status, setAISpeakingState, setListeningState]);

  // ── Socket.io Setup (runs once) ──
  useEffect(() => {
    mountedRef.current = true;
    setStatus(INTERVIEW_STATES.STARTING);
    startCamera();
    startVAD();
    loadModels();

    console.log("[SOCKET] Connecting...");
    const sock = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = sock;

    sock.on("connect", () => {
      console.log("[SOCKET] Connected:", sock.id);
      sock.emit("start_interview", { role: session?.role || "frontend" });
    });
    
    sock.on("disconnect", () => {
      console.warn("[SOCKET] Disconnected!");
    });

    sock.on("ai_token", ({ token }) => {
      if (!mountedRef.current) return;
      
      const s = statusRef.current;
      if (s !== INTERVIEW_STATES.PROCESSING && s !== INTERVIEW_STATES.SPEAKING && s !== INTERVIEW_STATES.THINKING) {
        // First token received — transition to PROCESSING
      }
      setStatus(INTERVIEW_STATES.PROCESSING);
      
      fullTranscriptRef.current += token;
      setAiTranscript(fullTranscriptRef.current);
      currentSentenceRef.current += token;

      // Sentence boundary detection: split on .?! followed by space or end-of-string
      const sentenceEndMatch = currentSentenceRef.current.match(/([.?!])\s/);
      if (sentenceEndMatch) {
        const splitIndex = sentenceEndMatch.index + 1;
        const completeSentence = currentSentenceRef.current.substring(0, splitIndex).trim();
        currentSentenceRef.current = currentSentenceRef.current.substring(splitIndex).trim();
        
        if (completeSentence.length > 0) {
          console.log(`[TTS] Speaking chunk: "${completeSentence.substring(0, 50)}..."`);
          setStatus(INTERVIEW_STATES.SPEAKING);
          queueSpeech(completeSentence);
        }
      }
    });

    sock.on("ai_finished", ({ fullText, isError, silent }) => {
      if (!mountedRef.current) return;
      console.log(`[SOCKET] ai_finished received. isError=${!!isError}, silent=${!!silent}`);
      
      // If silent error, just go back to listening without speaking
      if (silent) {
        setStatus(INTERVIEW_STATES.LISTENING);
        return;
      }
      
      const remaining = currentSentenceRef.current.trim();
      if (remaining.length > 0) {
        setStatus(INTERVIEW_STATES.SPEAKING);
        queueSpeech(remaining, () => {
          if (mountedRef.current) {
            console.log("[STATE] AI speech done → LISTENING");
            if (fullText) setQuestion(fullText);
            setStatus(INTERVIEW_STATES.LISTENING);
          }
        });
        currentSentenceRef.current = "";
      } else {
        // Nothing left to speak, switch immediately
        console.log("[STATE] AI response complete → LISTENING");
        if (fullText) setQuestion(fullText);
        setStatus(INTERVIEW_STATES.LISTENING);
      }
    });

    sock.on("ai_interrupted", () => {
      console.log("[SOCKET] Backend acknowledged interruption.");
    });

    return () => {
      mountedRef.current = false;
      sock.disconnect();
      stopCamera();
      stopSpeaking();
      stopListening();
      stopVAD();
    };
  }, []);

  // ── Mic lifecycle: start/stop recognition based on status ──
  useEffect(() => {
    if (status === INTERVIEW_STATES.LISTENING && isMicOn) {
      startListening();
    } else {
      stopListening();
    }
  }, [status, isMicOn]);

  // ── Camera & face-api ──

  async function loadModels() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      if (mountedRef.current) setModelsLoaded(true);
    } catch (err) {
      console.warn("Failed to load face-api models", err);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!mountedRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.warn("Error accessing camera:", err);
      if (mountedRef.current) setIsCameraOn(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  function handleVideoPlay() {
    if (!modelsLoaded || !videoRef.current || !mountedRef.current) return;
    setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused && mountedRef.current) {
        try {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks().withFaceExpressions();
          if (!mountedRef.current) return;
          if (detections.length > 0) {
            const expr = detections[0].expressions;
            let score = 100;
            if (expr.sad > 0.3) score -= 20;
            if (expr.fear > 0.3) score -= 30;
            if (expr.surprised > 0.5) score -= 10;
            setConfidenceScore(Math.max(0, Math.floor(score)));
          } else {
            setConfidenceScore(0);
          }
        } catch {}
      }
    }, 2000);
  }

  const toggleMic = () => setIsMicOn(!isMicOn);
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  // ── Render ──

  return (
    <div className="relative flex h-screen w-full flex-col bg-slate-950 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-black">
        <Canvas camera={{ position: [0, 1.5, 3.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={1.5} color="#4ade80" />
          <directionalLight position={[-2, 2, -2]} intensity={1} color="#3b82f6" />
          <Suspense fallback={null}>
            <AvatarModel />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 2 - 0.2} />
        </Canvas>
      </div>
      
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
        <h1 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Real-Time Voice AI
        </h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
            status === INTERVIEW_STATES.THINKING || status === INTERVIEW_STATES.PROCESSING ? "bg-purple-500/20 text-purple-400" :
            status === INTERVIEW_STATES.SPEAKING ? "bg-cyan-500/20 text-cyan-400" : 
            status === INTERVIEW_STATES.LISTENING ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : 
            status === INTERVIEW_STATES.INTERRUPTED ? "bg-red-500/20 text-red-400" : 
            "bg-slate-800 text-slate-400"
          }`}>
            {(status === INTERVIEW_STATES.THINKING || status === INTERVIEW_STATES.PROCESSING) && <Loader2 className="w-3 h-3 animate-spin" />}
            {status}
          </span>
        </div>
      </header>

      <main className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center px-8 pointer-events-none">
        <div className="w-full max-w-lg text-center">
          <p className={`text-xl font-bold transition-all duration-300 drop-shadow-md ${
            status === INTERVIEW_STATES.LISTENING ? "text-emerald-400 animate-pulse" : 
            status === INTERVIEW_STATES.INTERRUPTED ? "text-red-400" :
            (status === INTERVIEW_STATES.THINKING || status === INTERVIEW_STATES.PROCESSING) ? "text-cyan-400 italic" : "text-slate-400 opacity-0"
          }`}>
            {status === INTERVIEW_STATES.LISTENING ? "Listening..." : 
             status === INTERVIEW_STATES.INTERRUPTED ? "Interrupting..." : 
             (status === INTERVIEW_STATES.THINKING || status === INTERVIEW_STATES.PROCESSING) ? "AI is processing..." : ""}
          </p>
        </div>
      </main>

      <div className="absolute top-24 right-8 z-30 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300">
        <video ref={videoRef} autoPlay playsInline muted onPlay={handleVideoPlay} className={`h-36 w-48 object-cover ${!isCameraOn && "hidden"}`} />
        {!isCameraOn && (
          <div className="flex h-36 w-48 items-center justify-center bg-slate-800">
            <CameraOff className="text-slate-500" size={24} />
          </div>
        )}
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 flex h-24 items-center justify-center gap-6 bg-gradient-to-t from-slate-950 to-transparent px-6 pb-4">
        <button onClick={toggleMic} className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 relative ${isMicOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
          {isMicOn && status === INTERVIEW_STATES.LISTENING && <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75"></span>}
        </button>

        <button onClick={toggleCamera} className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isCameraOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
          {isCameraOn ? <Camera size={24} /> : <CameraOff size={24} />}
        </button>

        <button onClick={onEnd} className="flex h-14 px-8 items-center justify-center gap-2 rounded-full bg-red-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700 font-semibold">
          <PhoneOff size={20} />
          End Session
        </button>
      </footer>
    </div>
  );
}
