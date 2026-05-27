import * as faceapi from "face-api.js";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../../utils/api.js";
import AIAvatar from "./AIAvatar.jsx";
import useSpeechRecognition from "../../hooks/useSpeechRecognition.js";
import useTextToSpeech from "../../hooks/useTextToSpeech.js";

const MODEL_URL = "https://unpkg.com/@vladmandic/face-api/model";

export default function InterviewConsole({ session, onEnd }) {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [aiTranscript, setAiTranscript] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(100);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  
  const { isListening, transcript, start: startListening, stop: stopListening, reset: resetTranscript, supported: speechSupported } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  // Initialize Interview
  useEffect(() => {
    // Start camera and speech immediately to preserve the browser user gesture token
    startCamera();
    askNextQuestion(0);
    
    // Load face tracking models in the background
    loadModels();

    return () => {
      stopCamera();
      stopSpeaking();
      stopListening();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  // Sync mic state with hook
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
          setConfidenceScore(0); // No face detected
        }
      }
    }, 2000);
  }

  async function askNextQuestion(index) {
    try {
      const { data } = await api.post("/interviews/ask", {
        sessionId: session?.id,
        currentQuestionIndex: index,
        role: session?.role
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
    }
  }

  async function submitAnswer() {
    if (!transcript.trim()) return;
    
    stopListening();
    setAiTranscript("Analyzing your answer...");
    
    try {
      await api.post("/interviews/analyze-answer", {
        sessionId: session?.id,
        question: currentQuestion,
        answer: transcript
      });
      
      askNextQuestion(questionIndex + 1);
    } catch (err) {
      console.error("Error submitting answer:", err);
      setAiTranscript("I had trouble understanding that. Let's move on.");
      askNextQuestion(questionIndex + 1);
    }
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
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>
      
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
        <h1 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Interview Console
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

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-8">
        <AIAvatar isSpeaking={isSpeaking} />
        
        <div className="mt-12 w-full max-w-3xl space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm min-h-[100px]">
            <p className="text-sm font-semibold text-cyan-400 mb-2">AI Interviewer</p>
            <p className="text-lg text-slate-200 leading-relaxed">{aiTranscript}</p>
          </div>
          
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm min-h-[120px] flex flex-col justify-between">
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
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Send size={16} />
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="absolute bottom-24 right-8 z-30 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlay={handleVideoPlay}
          className={`h-48 w-64 object-cover ${!isCameraOn && "hidden"}`}
        />
        {!isCameraOn && (
          <div className="flex h-48 w-64 items-center justify-center bg-slate-800">
            <CameraOff className="text-slate-500" size={32} />
          </div>
        )}
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 flex h-20 items-center justify-center gap-6 bg-slate-950/80 border-t border-slate-800 backdrop-blur-md px-6">
        <button
          onClick={toggleMic}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            isMicOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"
          }`}
          title={isMicOn ? "Turn off mic" : "Turn on mic"}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleCamera}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            isCameraOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"
          }`}
          title={isCameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
        </button>

        <button
          onClick={onEnd}
          className="flex h-12 px-6 items-center justify-center gap-2 rounded-full bg-red-600 text-white transition-colors hover:bg-red-700 font-medium"
        >
          <PhoneOff size={20} />
          End Interview
        </button>
      </footer>
    </div>
  );
}
