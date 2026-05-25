import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { hrDemoCandidates } from "../data/hrDemoCandidates.js";
import { getScore } from "../utils/candidateMetrics.js";
import api from "../utils/api.js";

export default function CandidateReport() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    async function loadCandidate() {
      try {
        const { data } = await api.get(`/candidates/${id}`);
        setCandidate(data);
      } catch {
        setCandidate(hrDemoCandidates.find((item) => item.id === id) || hrDemoCandidates[0]);
      }
    }

    loadCandidate();
  }, [id]);

  if (!candidate) {
    return (
      <section className="panel p-6">
        <p className="text-sm font-semibold text-slate-500">Loading candidate report...</p>
      </section>
    );
  }

  const resume = candidate.parsedResume || {};
  const interview = candidate.interviewResult || {};

  return (
    <div className="space-y-5">
      <Link to="/hr" className="secondary-button">
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <section className="panel p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-tealcore">Candidate report</p>
            <h1 className="mt-1 text-3xl font-bold">{candidate.name}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{candidate.role}</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-4 py-3 text-right">
            <p className="text-xs font-bold uppercase text-slate-500">Overall score</p>
            <p className="text-3xl font-bold">{getScore(candidate, "overall")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="panel p-5">
          <h2 className="text-xl font-bold">Pre-meeting CV data</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{resume.summary}</p>
          <div className="mt-5">
            <p className="text-sm font-bold text-slate-500">Parsed skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(resume.skills || candidate.skills || []).map((skill) => (
                <span
                  className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-500">ATS score</p>
              <p className="mt-1 text-2xl font-bold">{resume.atsScore || "n/a"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-500">Education</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {(resume.education || []).join(", ") || "Not captured"}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-sm font-bold text-slate-500">Experience signals</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {(resume.experience || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="panel p-5">
          <h2 className="text-xl font-bold">Post-meeting AI results</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{interview.summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Code", "coding"],
              ["Communication", "communication"],
              ["Tech", "techKnowledge"],
              ["Confidence", "confidence"]
            ].map(([label, key]) => (
              <div className="rounded-lg border border-slate-200 p-4" key={key}>
                <p className="text-sm font-bold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold">{getScore(candidate, key)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-green-700">Strengths</p>
              <ul className="mt-3 space-y-2">
                {(candidate.strengths || interview.highlights || []).map((item) => (
                  <li
                    className="flex gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800"
                    key={item}
                  >
                    <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">Weaknesses</p>
              <ul className="mt-3 space-y-2">
                {(candidate.weaknesses || interview.risks || []).map((item) => (
                  <li
                    className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
                    key={item}
                  >
                    <XCircle className="mt-0.5 shrink-0" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
