import express from "express";
import {
  createCandidate,
  listCandidates,
  updateCandidateStatus
} from "../controllers/candidateController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listCandidates);
router.post("/", protect, createCandidate);
router.patch("/:id/status", protect, updateCandidateStatus);

export default router;
