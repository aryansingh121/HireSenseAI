import axios from "axios";

function fallbackAnswerAnalysis(answer) {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasStructure = /first|second|because|trade|example|therefore/i.test(answer);
  const score = Math.min(92, Math.max(55, wordCount * 2 + (hasStructure ? 18 : 8)));

  return {
    score,
    strengths: [
      hasStructure ? "Structured reasoning" : "Direct answer",
      wordCount > 35 ? "Sufficient detail" : "Concise response"
    ],
    improvements: [
      "Add a concrete project example",
      "Mention constraints, trade-offs, and measurable impact"
    ],
    sentiment: score >= 75 ? "confident" : "developing"
  };
}

export async function analyzeInterviewAnswer({ question, answer }) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackAnswerAnalysis(answer);
  }

  const prompt = [
    "You are an expert technical interviewer.",
    "Return strict JSON with score, strengths, improvements, and sentiment.",
    `Question: ${question}`,
    `Candidate answer: ${answer}`
  ].join("\n");

  try {
    const { data } = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Score technical accuracy, communication clarity, and interview readiness."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.warn("AI analysis fallback:", error.message);
    return fallbackAnswerAnalysis(answer);
  }
}

export async function generateInterviewReport(payload) {
  const overall = Math.round(
    (payload.communication + payload.coding + payload.confidence) / 3
  );

  return {
    candidateName: payload.candidateName,
    role: payload.role,
    recommendation:
      overall >= 82 ? "Strong shortlist" : overall >= 70 ? "Technical round" : "Hold",
    summary:
      "Generated assessment based on communication clarity, coding performance, and confidence signals.",
    scores: {
      communication: payload.communication,
      coding: payload.coding,
      confidence: payload.confidence,
      overall
    },
    strengths: ["Problem decomposition", "Relevant technical vocabulary"],
    risks: overall < 75 ? ["Needs deeper validation in live pairing"] : []
  };
}
