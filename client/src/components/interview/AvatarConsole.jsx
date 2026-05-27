import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import * as faceapi from "face-api.js";
import { io } from "socket.io-client";

import useInterviewStore, { INTERVIEW_STATES } from "../../store/useInterviewStore.js";
import useSpeechRecognition from "../../hooks/useSpeechRecognition.js";
import useTextToSpeech from "../../hooks/useTextToSpeech.js";
import useVoiceActivityDetection from "../../hooks/useVoiceActivityDetection.js";
import AvatarModel from "./AvatarModel.jsx";
import DebugOverlay from "./DebugOverlay.jsx";

const MODEL_URL = "https://unpkg.com/@vladmandic/face-api/model";
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AvatarConsole({ session, onEnd }) {
  const { 
    status, setStatus,
    setQuestion, setConfidenceScore,
    setSocketConnected, setCandidateTranscript, isProcessingResponse
  } = useInterviewStore();

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const lastSubmittedRef = useRef("");

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const streamEndedRef = useRef(false);
  
  // ── Stable Base Loop Pipeline ──

  const handleSpeechComplete = useCallback((finalTranscript) => {
    if (useInterviewStore.getState().isProcessingResponse) {
      console.warn("[ORCHESTRATOR] Ignored speech, already processing.");
      return;
    }
    
    if (finalTranscript === lastSubmittedRef.current) {
      console.warn("[ORCHESTRATOR] Ignored duplicate transcript.");
      return;
    }

    console.log(`[ORCHESTRATOR] Triggering AI generation with: "${finalTranscript}"`);
    lastSubmittedRef.current = finalTranscript;
    
    setStatus(INTERVIEW_STATES.PROCESSING);
    
    if (socketRef.current) {
      socketRef.current.emit("user_message", { transcript: finalTranscript });
    }
  }, [setStatus]);

  const { start: startListening, stop: stopListening } = useSpeechRecognition(handleSpeechComplete);

  const handleInterruption = useCallback(() => {
    const currentStatus = useInterviewStore.getState().status;
    if (currentStatus === INTERVIEW_STATES.SPEAKING || currentStatus === INTERVIEW_STATES.PROCESSING) {
      console.log("[INTERRUPTION] User interrupted AI!");
      stopSpeaking();
      setStatus(INTERVIEW_STATES.LISTENING);
      if (socketRef.current) {
        socketRef.current.emit("user_interrupted");
      }
    }
  }, [stopSpeaking, setStatus]);

  const { startVAD, stopVAD } = useVoiceActivityDetection(handleInterruption, null);

  // ── Socket.io Setup ──
  useEffect(() => {
    startCamera();
    loadModels();
    startVAD();

    console.log("[SOCKET] Connecting to backend...");
    const sock = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = sock;

    sock.on("connect", () => {
      console.log("[SOCKET] Connected:", sock.id);
      setSocketConnected(true);
      sock.emit("start_interview", { role: session?.role || "frontend" });
    });
    
    sock.on("disconnect", () => {
      console.warn("[SOCKET] Disconnected!");
      setSocketConnected(false);
    });

    sock.on("ai_response_chunk", ({ text, isError }) => {
      console.log(`[SOCKET] Received AI response chunk:`, text);
      setStatus(INTERVIEW_STATES.SPEAKING);
      setQuestion(text);
      
      speak(text, () => {
        // Individual chunk completed
      });
    });

    sock.on("ai_response_end", (options) => {
      console.log(`[SOCKET] Stream ended.`);
      streamEndedRef.current = true;
      
      if (options?.silent) {
        setStatus(INTERVIEW_STATES.LISTENING);
        setCandidateTranscript("");
      }
    });

    return () => {
      sock.disconnect();
      stopCamera();
      stopSpeaking();
      stopListening();
      stopVAD();
    };
  }, []);

  useEffect(() => {
    if (status === INTERVIEW_STATES.SPEAKING && streamEndedRef.current && !isSpeaking) {
      console.log("[ORCHESTRATOR] Queue empty and stream ended. Returning to LISTENING.");
      setCandidateTranscript("");
      streamEndedRef.current = false;
      setStatus(INTERVIEW_STATES.LISTENING);
    }
  }, [isSpeaking, status, setStatus, setCandidateTranscript]);

  // ── Mic lifecycle ──
  useEffect(() => {
    if (status === INTERVIEW_STATES.LISTENING && isMicOn) {
      startListening();
      streamEndedRef.current = false; // reset for next turn
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
      setModelsLoaded(true);
    } catch (err) {}
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setIsCameraOn(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }

  function handleVideoPlay() {
    if (!modelsLoaded || !videoRef.current) return;
    setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        try {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks().withFaceExpressions();
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

  return (
    <div className="relative flex h-screen w-full flex-col bg-slate-950 overflow-hidden font-sans">
      <DebugOverlay />
      
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
      
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 pl-96">
        <h1 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Real-Time Voice AI
        </h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
            status === INTERVIEW_STATES.PROCESSING ? "bg-purple-500/20 text-purple-400" :
            status === INTERVIEW_STATES.SPEAKING ? "bg-cyan-500/20 text-cyan-400" : 
            status === INTERVIEW_STATES.LISTENING ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : 
            "bg-slate-800 text-slate-400"
          }`}>
            {status === INTERVIEW_STATES.PROCESSING && <Loader2 className="w-3 h-3 animate-spin" />}
            {status}
          </span>
        </div>
      </header>

      <main className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center px-8 pointer-events-none">
        <div className="w-full max-w-lg text-center">
          <p className={`text-xl font-bold transition-all duration-300 drop-shadow-md ${
            status === INTERVIEW_STATES.LISTENING ? "text-emerald-400 animate-pulse" : 
            status === INTERVIEW_STATES.PROCESSING ? "text-cyan-400 italic" : "text-slate-400 opacity-0"
          }`}>
            {status === INTERVIEW_STATES.LISTENING ? "Listening..." : 
             status === INTERVIEW_STATES.PROCESSING ? "AI is processing..." : ""}
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
        <button onClick={() => setIsMicOn(!isMicOn)} className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 relative ${isMicOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
          {isMicOn && status === INTERVIEW_STATES.LISTENING && <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75"></span>}
        </button>

        <button onClick={() => setIsCameraOn(!isCameraOn)} className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isCameraOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
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
