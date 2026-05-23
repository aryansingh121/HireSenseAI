import express from "express";
import {
  analyzeAnswer,
  createInterviewSession
} from "../controllers/interviewController.js";

const router = express.Router();

router.post("/", createInterviewSession);
router.post("/analyze-answer", analyzeAnswer);

export default router;
