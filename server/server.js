import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import connectDB, { isDbReady } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const httpServer = createServer(app);
initSocket(httpServer);

await connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isDbReady() ? "connected" : "mock-mode",
    service: "HireSense AI API"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/coding", codingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  res.status(status).json({
    message: error.message || "Internal server error"
  });
});

httpServer.listen(port, () => {
  console.log(`HireSense AI API running on port ${port}`);
});
