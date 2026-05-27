import express from "express";
import {
  analyzeAnswer,
  completeDemoInterview,
  createInterviewLink,
  createInterviewSession,
  getDemoInterviewStatus,
  startDemoInterview,
  askNextQuestion,
  chatWithLLM
} from "../controllers/interviewController.js";
import { authorizeRole, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createInterviewSession);
router.post("/links", protect, authorizeRole("hiring_manager"), createInterviewLink);
router.get("/demo/status", protect, authorizeRole("candidate"), getDemoInterviewStatus);
router.post("/demo/start", protect, authorizeRole("candidate"), startDemoInterview);
router.post("/demo/complete", protect, authorizeRole("candidate"), completeDemoInterview);
router.post("/analyze-answer", analyzeAnswer);
router.post("/ask", askNextQuestion);
router.post("/chat", chatWithLLM);

export default router;
