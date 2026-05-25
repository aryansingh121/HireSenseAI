export function getCandidateId(candidate) {
  return candidate.id || candidate._id;
}

export function getScore(candidate, key) {
  if (candidate.scores?.[key] !== undefined) return candidate.scores[key];
  if (candidate[key] !== undefined) return candidate[key];
  return 0;
}

export function getPrimaryStrength(candidate) {
  return candidate.strengths?.[0] || "Not captured";
}

export function getPrimaryWeakness(candidate) {
  return candidate.weaknesses?.[0] || candidate.interviewResult?.risks?.[0] || "Not captured";
}

export function toRadarRows(firstCandidate, secondCandidate) {
  return [
    {
      metric: "Code Quality",
      first: getScore(firstCandidate, "coding"),
      second: getScore(secondCandidate, "coding")
    },
    {
      metric: "Communication",
      first: getScore(firstCandidate, "communication"),
      second: getScore(secondCandidate, "communication")
    },
    {
      metric: "Tech Knowledge",
      first: getScore(firstCandidate, "techKnowledge"),
      second: getScore(secondCandidate, "techKnowledge")
    },
    {
      metric: "Confidence",
      first: getScore(firstCandidate, "confidence"),
      second: getScore(secondCandidate, "confidence")
    }
  ];
}
