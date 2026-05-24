export const demoCandidates = [
  {
    id: "cand-01",
    name: "Aarav Mehta",
    email: "aarav@example.com",
    role: "Frontend Engineer",
    status: "Shortlist",
    skills: ["React", "TypeScript", "Testing"],
    scores: {
      communication: 86,
      coding: 79,
      confidence: 83,
      overall: 83
    }
  },
  {
    id: "cand-02",
    name: "Nisha Rao",
    email: "nisha@example.com",
    role: "Full Stack Developer",
    status: "Review",
    skills: ["Node.js", "MongoDB", "System Design"],
    scores: {
      communication: 75,
      coding: 91,
      confidence: 78,
      overall: 85
    }
  }
];

export const demoReports = [
  {
    id: "rep-101",
    candidateName: "Aarav Mehta",
    role: "Frontend Engineer",
    recommendation: "Strong shortlist",
    summary:
      "Clear React fundamentals, steady delivery under pressure, and solid trade-off reasoning.",
    scores: {
      communication: 86,
      coding: 79,
      confidence: 83,
      overall: 83
    },
    strengths: ["State management", "Debugging process", "Clear communication"],
    risks: ["Needs more production performance examples"]
  }
];
