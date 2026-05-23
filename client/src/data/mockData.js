export const dashboardStats = [
  {
    label: "Active interviews",
    value: "18",
    tone: "teal",
    trend: "+12%"
  },
  {
    label: "Shortlisted",
    value: "7",
    tone: "amber",
    trend: "+3"
  },
  {
    label: "Avg. hiring score",
    value: "82",
    tone: "plum",
    trend: "+6 pts"
  },
  {
    label: "Reports ready",
    value: "31",
    tone: "slate",
    trend: "Today"
  }
];

export const candidates = [
  {
    id: "cand-01",
    name: "Aarav Mehta",
    role: "Frontend Engineer",
    status: "Shortlist",
    communication: 86,
    coding: 79,
    confidence: 83
  },
  {
    id: "cand-02",
    name: "Nisha Rao",
    role: "Full Stack Developer",
    status: "Review",
    communication: 75,
    coding: 91,
    confidence: 78
  },
  {
    id: "cand-03",
    name: "Kabir Shah",
    role: "Backend Engineer",
    status: "Hold",
    communication: 69,
    coding: 84,
    confidence: 66
  }
];

export const reports = [
  {
    id: "rep-101",
    candidate: "Aarav Mehta",
    role: "Frontend Engineer",
    recommendation: "Strong shortlist",
    summary:
      "Clear React fundamentals, steady delivery under pressure, and solid trade-off reasoning.",
    scores: {
      communication: 86,
      coding: 79,
      confidence: 83,
      overall: 83
    }
  },
  {
    id: "rep-102",
    candidate: "Nisha Rao",
    role: "Full Stack Developer",
    recommendation: "Technical round",
    summary:
      "Excellent debugging structure and strong API design instincts. Communication was concise.",
    scores: {
      communication: 75,
      coding: 91,
      confidence: 78,
      overall: 85
    }
  }
];

export const interviewQuestions = [
  "Explain how React state updates are batched.",
  "Design a rate limiter for a public API.",
  "What happens when a user submits a form in a MERN app?",
  "How would you debug a slow MongoDB query?"
];
