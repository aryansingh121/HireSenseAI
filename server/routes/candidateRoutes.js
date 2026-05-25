import express from "express";
import {
  createCandidate,
  getCandidate,
  listCandidates,
  updateCandidateStatus
} from "../controllers/candidateController.js";
import { authorizeRole, protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, authorizeRole("hiring_manager"), listCandidates);
router.get("/:id", protect, authorizeRole("hiring_manager"), getCandidate);
router.post("/", protect, authorizeRole("hiring_manager"), createCandidate);
router.patch("/:id/status", protect, authorizeRole("hiring_manager"), updateCandidateStatus);

export default router;
