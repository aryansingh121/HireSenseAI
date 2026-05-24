import express from "express";
import { runCode } from "../controllers/codingController.js";
import { analyzeConfidence } from "../controllers/confidenceController.js";

const router = express.Router();

router.post("/run", runCode);
router.post("/confidence", analyzeConfidence);

export default router;
