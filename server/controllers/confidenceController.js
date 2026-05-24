import { calculateConfidenceSignals } from "../services/confidenceService.js";

export function analyzeConfidence(req, res) {
  res.json(calculateConfidenceSignals(req.body));
}
