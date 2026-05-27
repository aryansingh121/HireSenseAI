import { GoogleGenerativeAI } from "@google/generative-ai";

const activeSessions = new Map();
let geminiModel = null;

// Initialize the model once at module load
function getModel() {
  if (!geminiModel) {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("[Gemini] Model initialized successfully.");
  }
  return geminiModel;
}

export function registerInterviewHandlers(io, socket) {
  // Initialize session memory
  activeSessions.set(socket.id, {
    history: [],
    role: "frontend",
    isProcessing: false,
    errorCount: 0,
  });

  socket.on("start_interview", async ({ role }) => {
    const session = activeSessions.get(socket.id);
    if (session) {
      session.role = role || "frontend";
      session.errorCount = 0;
    }
    console.log(`[Socket.io] Starting interview for ${socket.id}, role: ${role}`);
    
    // Trigger initial greeting
    await generateAIResponse(socket, "Start the interview by introducing yourself briefly and asking the first technical question.");
  });

  socket.on("user_speaking", () => {
    // Interruption handling
    const session = activeSessions.get(socket.id);
    if (session && session.isProcessing) {
      session.isProcessing = false;
      console.log(`[Socket.io] Interrupted generation for ${socket.id}`);
      socket.emit("ai_interrupted");
    }
  });

  socket.on("user_stopped", async ({ transcript }) => {
    if (!transcript || transcript.trim().length < 2) {
      console.log(`[Socket.io] Ignoring empty/short transcript from ${socket.id}`);
      return;
    }
    console.log(`[Socket.io] User ${socket.id} answered: "${transcript}"`);
    await generateAIResponse(socket, transcript);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    activeSessions.delete(socket.id);
  });
}

async function generateAIResponse(socket, userMessage) {
  const session = activeSessions.get(socket.id);
  if (!session) return;

  // Prevent duplicate concurrent requests
  if (session.isProcessing) {
    console.log(`[Socket.io] Already processing for ${socket.id}, skipping.`);
    return;
  }

  session.isProcessing = true;

  try {
    const model = getModel();
    
    // Add user message to history (skip the initial system prompt)
    const isInitialGreeting = userMessage === "Start the interview by introducing yourself briefly and asking the first technical question.";
    if (!isInitialGreeting) {
      session.history.push(`Candidate: ${userMessage}`);
    }

    // Keep only last 10 turns for low latency
    if (session.history.length > 10) {
      session.history = session.history.slice(-10);
    }

    const prompt = `You are a real-time conversational AI Technical Hiring Manager interviewing a candidate for a ${session.role} position.
Your responses MUST be short, natural, and conversational. Do not use markdown, bullet points, or formatting. 
Speak like a human over a phone call. Ask one question at a time. Keep responses under 3 sentences.
${session.history.length > 0 ? `\nConversation so far:\n${session.history.join("\n")}` : ""}

${isInitialGreeting ? "Start by briefly introducing yourself and asking the first question." : `Candidate just said: "${userMessage}"\n\nRespond naturally and ask a follow-up question.`}`;

    console.log(`[Gemini] Sending prompt for ${socket.id}...`);

    const result = await model.generateContentStream(prompt);

    let fullResponse = "";

    for await (const chunk of result.stream) {
      if (!session.isProcessing) {
        console.log(`[Gemini] Stream cancelled for ${socket.id}`);
        break;
      }
      
      const token = chunk.text();
      if (token) {
        fullResponse += token;
        socket.emit("ai_token", { token });
      }
    }

    if (session.isProcessing && fullResponse.trim().length > 0) {
      session.history.push(`AI: ${fullResponse.trim()}`);
      socket.emit("ai_finished", { fullText: fullResponse.trim() });
      session.errorCount = 0;
      console.log(`[Gemini] Response complete for ${socket.id}: "${fullResponse.trim().substring(0, 80)}..."`);
    }

  } catch (error) {
    console.error(`[Gemini] Stream Error for ${socket.id}:`, error.message);
    session.errorCount = (session.errorCount || 0) + 1;
    
    // Only emit fallback if we haven't already errored too many times
    if (session.errorCount <= 2) {
      const fallback = "I had a brief connection issue. Could you repeat what you just said?";
      socket.emit("ai_token", { token: fallback });
      socket.emit("ai_finished", { fullText: fallback, isError: true });
    } else {
      // After 2 consecutive errors, just go back to listening silently
      console.error(`[Gemini] Too many consecutive errors for ${socket.id}, suppressing fallback.`);
      socket.emit("ai_finished", { fullText: "", isError: true, silent: true });
    }
  } finally {
    session.isProcessing = false;
  }
}
