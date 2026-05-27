import { GoogleGenerativeAI } from "@google/generative-ai";

const activeSessions = new Map();
let geminiModel = null;

// Initialize the model once at module load
function getModel() {
  if (!geminiModel) {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = ai.getGenerativeModel({ model: "gemini-pro" });
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
    abortController: null,
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

  // Simplified: only respond when user completely finishes speaking
  socket.on("user_message", async ({ transcript }) => {
    if (!transcript || transcript.trim().length < 2) {
      console.log(`[Socket.io] Ignoring empty/short transcript from ${socket.id}`);
      return;
    }
    console.log(`[Socket.io] User ${socket.id} answered: "${transcript}"`);
    await generateAIResponse(socket, transcript);
  });

  socket.on("user_interrupted", () => {
    const session = activeSessions.get(socket.id);
    if (session && session.isProcessing && session.abortController) {
      console.log(`[Socket.io] User ${socket.id} interrupted. Aborting AI generation.`);
      session.abortController.abort();
      session.abortController = null;
      session.isProcessing = false;
    }
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
  session.abortController = new AbortController();

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

    // Phase 5: Streaming AI Responses
    const resultStream = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }, {
      signal: session.abortController.signal
    });

    let fullResponse = "";
    let buffer = "";

    for await (const chunk of resultStream.stream) {
      if (session.abortController?.signal?.aborted) break;
      
      const text = chunk.text();
      fullResponse += text;
      buffer += text;
      
      // Buffer until we hit a sentence boundary (., !, ?)
      const match = buffer.match(/[^.!?]+[.!?]+/g);
      if (match) {
        const sentence = match[0];
        socket.emit("ai_response_chunk", { text: sentence.trim() });
        buffer = buffer.slice(sentence.length);
      }
    }

    // Flush any remaining partial sentence
    if (buffer.trim() && !session.abortController?.signal?.aborted) {
      socket.emit("ai_response_chunk", { text: buffer.trim() });
    }

    if (!session.abortController?.signal?.aborted) {
      session.history.push(`AI: ${fullResponse.trim()}`);
      socket.emit("ai_response_end");
      session.errorCount = 0;
      console.log(`[Gemini] Stream complete for ${socket.id}`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[Gemini] Generation aborted for ${socket.id} due to user interruption.`);
      return;
    }
    
    console.error(`[Gemini] Error for ${socket.id}:`, error.message);
    session.errorCount = (session.errorCount || 0) + 1;
    
    // Only emit fallback if we haven't already errored too many times
    if (session.errorCount <= 1) {
      const fallback = "I had a brief connection issue. Could you repeat what you just said?";
      socket.emit("ai_response_chunk", { text: fallback, isError: true });
      socket.emit("ai_response_end");
    } else {
      // After 1 consecutive error, just go back to listening silently to break loop
      console.error(`[Gemini] Too many consecutive errors for ${socket.id}, suppressing fallback.`);
      socket.emit("ai_response_end", { silent: true });
    }
  } finally {
    session.isProcessing = false;
  }
}
