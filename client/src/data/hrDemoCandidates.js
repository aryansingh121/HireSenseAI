export const hrDemoCandidates = [
  {
    id: "cand-01",
    name: "Aarav Mehta",
    email: "aarav@example.com",
    role: "Frontend Engineer",
    status: "Shortlist",
    skills: ["React", "TypeScript", "Testing"],
    strengths: ["React architecture", "Clear communication", "Component testing"],
    weaknesses: ["Needs deeper system design examples"],
    parsedResume: {
      summary:
        "Frontend engineer with 3 years of React experience across SaaS dashboards and hiring workflows.",
      experience: [
        "Built reusable React component systems for analytics products.",
        "Improved dashboard load performance by 28% through code splitting."
      ],
      education: ["B.Tech Computer Science"],
      skills: ["React", "TypeScript", "Testing", "Tailwind CSS"],
      atsScore: 86
    },
    scores: {
      communication: 86,
      coding: 79,
      confidence: 83,
      techKnowledge: 82,
      overall: 83
    },
    interviewResult: {
      summary:
        "Strong frontend fundamentals with clear trade-off reasoning and calm problem solving.",
      recommendation: "Strong shortlist",
      questionsAnswered: 7,
      highlights: ["Explained batching accurately", "Used practical testing examples"],
      risks: ["System design answers need more scale detail"]
    }
  },
  {
    id: "cand-02",
    name: "Nisha Rao",
    email: "nisha@example.com",
    role: "Full Stack Developer",
    status: "Review",
    skills: ["Node.js", "MongoDB", "System Design"],
    strengths: ["API design", "Debugging", "Database modeling"],
    weaknesses: ["Communication could be more structured"],
    parsedResume: {
      summary:
        "Full stack developer focused on Node.js, MongoDB, REST APIs, and deployment automation.",
      experience: [
        "Implemented multi-tenant Express APIs with JWT authentication.",
        "Designed MongoDB schemas for reporting and activity tracking."
      ],
      education: ["B.E. Information Technology"],
      skills: ["Node.js", "MongoDB", "System Design", "Docker"],
      atsScore: 89
    },
    scores: {
      communication: 75,
      coding: 91,
      confidence: 78,
      techKnowledge: 88,
      overall: 85
    },
    interviewResult: {
      summary:
        "Excellent backend reasoning and strong coding score. Needs more concise verbal structure.",
      recommendation: "Technical round",
      questionsAnswered: 8,
      highlights: ["Modeled APIs cleanly", "Handled edge cases in coding round"],
      risks: ["Occasional long answers without a crisp conclusion"]
    }
  },
  {
    id: "cand-03",
    name: "Kabir Shah",
    email: "kabir@example.com",
    role: "Backend Engineer",
    status: "Hold",
    skills: ["Express", "PostgreSQL", "Redis"],
    strengths: ["Caching strategy", "Operational awareness"],
    weaknesses: ["Lower confidence signals", "Incomplete test coverage answer"],
    parsedResume: {
      summary:
        "Backend engineer with API and caching experience, currently growing cloud deployment skills.",
      experience: [
        "Created internal Express services for queue-based processing.",
        "Used Redis caching to reduce repeated database reads."
      ],
      education: ["B.Sc. Computer Applications"],
      skills: ["Express", "PostgreSQL", "Redis", "Queues"],
      atsScore: 74
    },
    scores: {
      communication: 69,
      coding: 84,
      confidence: 66,
      techKnowledge: 79,
      overall: 76
    },
    interviewResult: {
      summary:
        "Good backend instincts, but confidence and testing depth need more validation.",
      recommendation: "Hold",
      questionsAnswered: 6,
      highlights: ["Explained caching trade-offs", "Handled API failures thoughtfully"],
      risks: ["Needs stronger testing examples", "Presentation lacked confidence"]
    }
  }
];
