import React, { createContext, useContext, useReducer, useEffect } from "react";

const InterviewContext = createContext();

export const INTERVIEW_STATES = {
  IDLE: "IDLE",
  STARTING: "STARTING",
  THINKING: "THINKING",
  SPEAKING: "SPEAKING",
  LISTENING: "LISTENING",
  INTERRUPTED: "INTERRUPTED",
  PROCESSING: "PROCESSING",
  ERROR: "ERROR",
  COMPLETED: "COMPLETED",
};

const initialState = {
  status: INTERVIEW_STATES.IDLE,
  currentQuestion: "",
  aiTranscript: "Initializing 3D Interview Environment...",
  candidateTranscript: "",
  confidenceScore: 100,
  error: null,
};

function interviewReducer(state, action) {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_QUESTION":
      return { ...state, currentQuestion: action.payload };
    case "SET_AI_TRANSCRIPT":
      return { ...state, aiTranscript: action.payload };
    case "SET_CANDIDATE_TRANSCRIPT":
      return { ...state, candidateTranscript: action.payload };
    case "SET_CONFIDENCE_SCORE":
      return { ...state, confidenceScore: action.payload };
    case "SET_ERROR":
      return { ...state, status: INTERVIEW_STATES.ERROR, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function InterviewProvider({ children }) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  // Global state actions
  const setStatus = (status) => dispatch({ type: "SET_STATUS", payload: status });
  const setQuestion = (q) => dispatch({ type: "SET_QUESTION", payload: q });
  const setAiTranscript = (t) => dispatch({ type: "SET_AI_TRANSCRIPT", payload: t });
  const setCandidateTranscript = (t) => dispatch({ type: "SET_CANDIDATE_TRANSCRIPT", payload: t });
  const setConfidenceScore = (s) => dispatch({ type: "SET_CONFIDENCE_SCORE", payload: s });
  const setError = (err) => dispatch({ type: "SET_ERROR", payload: err });

  return (
    <InterviewContext.Provider
      value={{
        ...state,
        setStatus,
        setQuestion,
        setAiTranscript,
        setCandidateTranscript,
        setConfidenceScore,
        setError,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
}
