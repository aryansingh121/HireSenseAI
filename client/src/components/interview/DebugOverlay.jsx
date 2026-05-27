import React from 'react';
import useInterviewStore, { INTERVIEW_STATES } from '../../store/useInterviewStore.js';
import { Mic, Activity, Wifi, MessageSquare } from 'lucide-react';

export default function DebugOverlay() {
  const { 
    status, 
    micActive, 
    socketConnected, 
    candidateTranscript 
  } = useInterviewStore();

  return (
    <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 p-4 bg-black/80 border border-slate-700/50 rounded-xl backdrop-blur-md shadow-2xl font-mono text-xs text-slate-300 w-80 pointer-events-none">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-2">
        <span className="font-bold text-cyan-400">TELEMETRY</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          status === INTERVIEW_STATES.ERROR ? 'bg-red-500/20 text-red-400' :
          status === INTERVIEW_STATES.LISTENING ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' :
          status === INTERVIEW_STATES.SPEAKING ? 'bg-cyan-500/20 text-cyan-400' :
          status === INTERVIEW_STATES.PROCESSING ? 'bg-purple-500/20 text-purple-400' :
          'bg-slate-800 text-slate-400'
        }`}>
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic size={14} className={micActive ? "text-emerald-400" : "text-slate-600"} />
          <span>MIC (Browser Native)</span>
        </div>
        <span className={micActive ? "text-emerald-400" : "text-slate-500"}>
          {micActive ? 'ACTIVE' : 'STOPPED'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi size={14} className={socketConnected ? "text-emerald-400" : "text-red-400"} />
          <span>SOCKET</span>
        </div>
        <span className={socketConnected ? "text-emerald-400" : "text-red-400"}>
          {socketConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-slate-400">
          <MessageSquare size={14} />
          <span>LATEST VALIDATED TRANSCRIPT</span>
        </div>
        <div className="p-2 bg-slate-900/50 rounded min-h-[40px] italic overflow-hidden text-ellipsis line-clamp-3">
          {candidateTranscript || <span className="text-slate-600">No transcript yet...</span>}
        </div>
      </div>
    </div>
  );
}
