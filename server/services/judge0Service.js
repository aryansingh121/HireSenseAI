import axios from "axios";

const languageIds = {
  cpp: 54,
  java: 62,
  javascript: 63,
  python: 71
};

export async function runCodeWithJudge0({ language, sourceCode, stdin }) {
  if (!process.env.JUDGE0_API_URL) {
    return {
      status: "Accepted",
      runtime: "mock",
      memory: "mock",
      output: language === "javascript" ? "[0, 1]" : "Execution completed"
    };
  }

  const baseUrl = process.env.JUDGE0_API_URL.replace(/\/$/, "");
  const headers = process.env.JUDGE0_API_KEY
    ? {
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
        "X-RapidAPI-Host": process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com"
      }
    : {};

  const submission = await axios.post(
    `${baseUrl}/submissions?base64_encoded=false&wait=true`,
    {
      language_id: languageIds[language] || languageIds.javascript,
      source_code: sourceCode,
      stdin
    },
    { headers, timeout: 20000 }
  );

  return {
    status: submission.data.status?.description || "Unknown",
    runtime: submission.data.time ? `${submission.data.time}s` : "n/a",
    memory: submission.data.memory ? `${submission.data.memory} KB` : "n/a",
    output: submission.data.stdout || submission.data.stderr || submission.data.compile_output || ""
  };
}
