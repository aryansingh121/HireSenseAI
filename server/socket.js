import { Server } from "socket.io";

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Receive audio chunks from client
    socket.on("audio_stream", (data) => {
      // Mock LLM & Avatar API processing
      console.log(`[Socket.io] Received audio chunk of size: ${data?.byteLength || data?.length} bytes from ${socket.id}`);
      
      // Placeholder for STT -> LLM -> TTS -> Avatar logic
      // e.g. send the text prompt to HeyGen/D-ID stream
    });

    // Proctoring event listener
    socket.on("cheat_flag", (data) => {
      console.log(`[PROCTORING ALERT] Candidate triggered cheat_flag!`);
      console.log(`- Socket ID: ${socket.id}`);
      console.log(`- Timestamp: ${new Date(data?.timestamp).toISOString()}`);
      console.log(`- Event details: ${JSON.stringify(data)}`);
      
      // Normally, save this flag to the candidate's InterviewSession report in DB
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
