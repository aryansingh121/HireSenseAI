import { isDbReady } from "../config/db.js";
import Candidate from "../models/Candidate.js";
import { demoCandidates } from "../services/demoData.js";

export async function listCandidates(req, res, next) {
  try {
    if (!isDbReady()) return res.json(demoCandidates);

    const candidates = await Candidate.find().sort({ updatedAt: -1 });
    return res.json(candidates);
  } catch (error) {
    return next(error);
  }
}

export async function createCandidate(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ message: "MongoDB is required to create candidates" });
    }

    const candidate = await Candidate.create(req.body);
    return res.status(201).json(candidate);
  } catch (error) {
    return next(error);
  }
}

export async function updateCandidateStatus(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ message: "MongoDB is required to update candidates" });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    return res.json(candidate);
  } catch (error) {
    return next(error);
  }
}
