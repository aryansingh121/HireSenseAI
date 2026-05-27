import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Send } from "lucide-react";
import { useEffect, useRef, useState, Suspense } from "react";
import * as faceapi from "face-api.js";
import api from "../../utils/api.js";
import useSpeechRecognition from "../../hooks/useSpeechRecognition.js";
import useTextToSpeech from "../../hooks/useTextToSpeech.js";
import AvatarModel from "./AvatarModel.jsx";

const MODEL_URL = "https://unpkg.com/@vladmandic/face-api/model";

export default function AvatarConsole({ session, onEnd }) {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [aiTranscript, setAiTranscript] = useState("Initializing 3D Interview Environment...");
  const [confidenceScore, setConfidenceScore] = useState(100);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  
  const { isListening, transcript, start: startListening, stop: stopListening, reset: resetTranscript } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  useEffect(() => {
    // Start camera immediately
    startCamera();
    
    // Load models async
    loadModels().then(() => {
      // Begin the interview by asking the first question
      askNextQuestion(0);
    });

    return () => {
      stopCamera();
      stopSpeaking();
      stopListening();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  // Sync mic state
  useEffect(() => {
    if (isMicOn && !isSpeaking && currentQuestion) {
      startListening();
    } else {
      stopListening();
    }
  }, [isMicOn, isSpeaking, currentQuestion]);

  async function loadModels() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load face-api models:", err);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  function handleVideoPlay() {
    if (!modelsLoaded || !videoRef.current) return;
    
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceExpressions();
        
        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          let score = 100;
          if (expressions.sad > 0.3) score -= 20;
          if (expressions.fear > 0.3) score -= 30;
          if (expressions.surprised > 0.5) score -= 10;
          setConfidenceScore(Math.max(0, Math.floor(score)));
        } else {
          setConfidenceScore(0);
        }
      }
    }, 2000);
  }

  async function askNextQuestion(index, prevTranscript = "") {
    try {
      // Use the new Gemini LLM /chat endpoint
      const { data } = await api.post("/interviews/chat", {
        sessionId: session?.id,
        role: session?.role,
        transcript: prevTranscript,
        history: currentQuestion ? `AI: ${currentQuestion}\nCandidate: ${prevTranscript}` : "Start of interview"
      });

      if (data.isFinished) {
        setAiTranscript(data.question);
        speak(data.question, () => {
          setTimeout(onEnd, 2000);
        });
        return;
      }

      setQuestionIndex(index);
      setCurrentQuestion(data.question);
      setAiTranscript(data.question);
      
      speak(data.question, () => {
        resetTranscript();
        startListening();
      });
    } catch (err) {
      console.error("Error fetching next question:", err);
      setAiTranscript("Network error occurred.");
    }
  }

  async function submitAnswer() {
    if (!transcript.trim()) return;
    
    stopListening();
    setAiTranscript("Analyzing your answer with LLM...");
    
    await askNextQuestion(questionIndex + 1, transcript);
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

  return (
    <div className="relative flex h-screen w-full flex-col bg-slate-950 overflow-hidden font-sans">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-black">
        <Canvas camera={{ position: [0, 1.5, 3.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={1.5} color="#4ade80" />
          <directionalLight position={[-2, 2, -2]} intensity={1} color="#3b82f6" />
          
          <Suspense fallback={null}>
            <AvatarModel />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 + 0.1} 
            minPolarAngle={Math.PI / 2 - 0.2}
          />
        </Canvas>
      </div>
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
        <h1 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          3D AI Interview
        </h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${confidenceScore > 70 ? "bg-green-500/20 text-green-400" : confidenceScore > 40 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
            Confidence: {confidenceScore}%
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isSpeaking ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400"}`}>
            {isSpeaking ? "AI Speaking" : "AI Listening"}
          </span>
        </div>
      </header>

      {/* Subtitles Overlay */}
      <main className="absolute bottom-28 left-0 right-0 z-10 flex flex-col items-center px-8 pointer-events-none">
        <div className="w-full max-w-4xl space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-6 backdrop-blur-md min-h-[100px] shadow-2xl">
            <p className="text-sm font-semibold text-cyan-400 mb-2">AI Manager</p>
            <p className="text-lg text-slate-200 leading-relaxed font-medium">{aiTranscript}</p>
          </div>
          
          <div className="rounded-xl border border-emerald-900/50 bg-slate-900/80 p-6 backdrop-blur-md min-h-[120px] flex flex-col justify-between shadow-2xl pointer-events-auto">
            <div>
              <p className="text-sm font-semibold text-emerald-400 mb-2">Your Answer</p>
              <p className="text-lg text-slate-300 leading-relaxed">
                {transcript || (isListening ? <span className="text-slate-500 italic">Listening...</span> : "Mic is off.")}
              </p>
            </div>
            
            {!isSpeaking && transcript.length > 0 && (
              <div className="flex justify-end mt-4">
                <button 
                  onClick={submitAnswer}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg"
                >
                  <Send size={16} />
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Webcam Corner */}
      <div className="absolute top-24 right-8 z-30 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlay={handleVideoPlay}
          className={`h-36 w-48 object-cover ${!isCameraOn && "hidden"}`}
        />
        {!isCameraOn && (
          <div className="flex h-36 w-48 items-center justify-center bg-slate-800">
            <CameraOff className="text-slate-500" size={24} />
          </div>
        )}
      </div>

      {/* Control Bar */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 flex h-24 items-center justify-center gap-6 bg-gradient-to-t from-slate-950 to-transparent px-6 pb-4">
        <button
          onClick={toggleMic}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${
            isMicOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600" : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${
            isCameraOn ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600" : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          {isCameraOn ? <Camera size={24} /> : <CameraOff size={24} />}
        </button>

        <button
          onClick={onEnd}
          className="flex h-14 px-8 items-center justify-center gap-2 rounded-full bg-red-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700 font-semibold"
        >
          <PhoneOff size={20} />
          End Session
        </button>
      </footer>
    </div>
  );
}
