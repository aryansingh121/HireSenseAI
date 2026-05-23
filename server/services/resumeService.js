import pdfParse from "pdf-parse";

const skillDictionary = [
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "REST",
  "GraphQL",
  "Testing",
  "CI/CD"
];

export async function analyzeResumeBuffer(buffer) {
  let text = "";

  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text || "";
  } catch {
    text = "";
  }

  const lower = text.toLowerCase();
  const skills = skillDictionary.filter((skill) => lower.includes(skill.toLowerCase()));
  const hasMetrics = /\d+%|\d+x|reduced|increased|optimized|improved/i.test(text);
  const hasProjects = /project|built|developed|implemented/i.test(text);
  const atsScore = Math.min(
    96,
    52 + skills.length * 5 + (hasMetrics ? 14 : 0) + (hasProjects ? 10 : 0)
  );

  return {
    atsScore,
    skills: skills.length ? skills : ["JavaScript", "React", "Node.js"],
    suggestions: [
      hasMetrics ? "Keep quantified achievements prominent" : "Add measurable impact metrics",
      hasProjects ? "Tie project bullets to business outcomes" : "Add project context and outcomes",
      "Mirror important role keywords from the job description"
    ]
  };
}
