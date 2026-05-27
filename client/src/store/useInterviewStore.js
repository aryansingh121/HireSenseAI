import { create } from 'zustand';

export const INTERVIEW_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
  ERROR: 'ERROR'
};

const useInterviewStore = create((set, get) => ({
  // INTERVIEW STATE
  status: INTERVIEW_STATES.IDLE,
  currentQuestion: "",
  candidateTranscript: "",
  confidenceScore: 100,
  
  // SINGLE SOURCE OF TRUTH LOCKS
  isProcessingResponse: false, 

  // TELEMETRY
  micActive: false,
  socketConnected: false,
  vadState: 'silent',
  
  // ACTIONS
  setStatus: (newStatus) => {
    const current = get().status;
    
    if (current === newStatus) return; // Ignore duplicate sets
    
    // Manage Mutex lock
    if (newStatus === INTERVIEW_STATES.PROCESSING || newStatus === INTERVIEW_STATES.SPEAKING) {
      set({ isProcessingResponse: true });
    } else {
      set({ isProcessingResponse: false });
    }

    console.log(`[STATE MACHINE] ${current} → ${newStatus}`);
    set({ status: newStatus });
  },
  
  setQuestion: (q) => set({ currentQuestion: q }),
  setCandidateTranscript: (t) => set({ candidateTranscript: t }),
  setConfidenceScore: (s) => set({ confidenceScore: s }),
  
  // TELEMETRY ACTIONS
  setMicActive: (active) => set({ micActive: active }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  setVadState: (state) => set({ vadState: state }),
  
  // RESET
  reset: () => set({
    status: INTERVIEW_STATES.IDLE,
    currentQuestion: "",
    candidateTranscript: "",
    confidenceScore: 100,
    isProcessingResponse: false,
  })
}));

export default useInterviewStore;
