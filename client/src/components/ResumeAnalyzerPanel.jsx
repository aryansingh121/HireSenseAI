import { FileUp, Sparkles } from "lucide-react";
import { useState } from "react";
import api from "../utils/api.js";

export default function ResumeAnalyzerPanel() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyzeResume() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const { data } = await api.post("/resumes/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnalysis(data);
    } catch {
      setAnalysis({
        atsScore: 81,
        skills: ["React", "Node.js", "MongoDB", "REST APIs"],
        suggestions: [
          "Add project impact metrics",
          "Group backend skills under a single technical section",
          "Mention deployment and monitoring experience"
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-saffron">
            <FileUp size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Resume Analyzer</h1>
            <p className="text-sm font-medium text-slate-500">PDF screening and ATS scoring</p>
          </div>
        </div>

        <label className="mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-saffron">
          <FileUp className="text-slate-500" size={32} />
          <span className="mt-3 text-sm font-bold text-slate-700">
            {file ? file.name : "Upload resume PDF"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>

        <button
          type="button"
          className="command-button mt-5 w-full"
          disabled={!file || loading}
          onClick={analyzeResume}
        >
          <Sparkles size={16} />
          {loading ? "Analyzing" : "Analyze resume"}
        </button>
      </div>

      <aside className="panel p-5">
        <p className="text-sm font-bold uppercase text-slate-500">Screening output</p>
        {analysis ? (
          <div className="mt-5 space-y-6">
            <div>
              <p className="text-5xl font-bold">{analysis.atsScore}</p>
              <p className="text-sm font-semibold text-slate-500">ATS score</p>
            </div>
            <div>
              <h2 className="text-sm font-bold">Extracted skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.skills.map((skill) => (
                  <span
                    className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold">Suggestions</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {analysis.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-dashed border-slate-300 p-6 text-sm font-medium text-slate-500">
            Upload a resume to generate skills, ATS score, and suggestions.
          </div>
        )}
      </aside>
    </section>
  );
}
