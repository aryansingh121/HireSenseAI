import { useEffect, useMemo, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { hrDemoCandidates } from "../data/hrDemoCandidates.js";
import { getCandidateId, getScore, toRadarRows } from "../utils/candidateMetrics.js";
import api from "../utils/api.js";

export default function CompareCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        const { data } = await api.get("/candidates");
        setCandidates(data);
        setFirstId(data[0] ? getCandidateId(data[0]) : "");
        setSecondId(data[1] ? getCandidateId(data[1]) : data[0] ? getCandidateId(data[0]) : "");
      } catch {
        setCandidates(hrDemoCandidates);
        setFirstId(hrDemoCandidates[0].id);
        setSecondId(hrDemoCandidates[1].id);
      }
    }

    loadCandidates();
  }, []);

  const firstCandidate = candidates.find((candidate) => getCandidateId(candidate) === firstId);
  const secondCandidate = candidates.find((candidate) => getCandidateId(candidate) === secondId);

  const radarRows = useMemo(() => {
    if (!firstCandidate || !secondCandidate) return [];
    return toRadarRows(firstCandidate, secondCandidate);
  }, [firstCandidate, secondCandidate]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-tealcore">Compare candidates</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">Side-by-side evaluation</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[firstId, secondId].map((selectedId, index) => (
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
              key={index === 0 ? "first" : "second"}
              value={selectedId}
              onChange={(event) =>
                index === 0 ? setFirstId(event.target.value) : setSecondId(event.target.value)
              }
            >
              {candidates.map((candidate) => (
                <option key={getCandidateId(candidate)} value={getCandidateId(candidate)}>
                  {candidate.name}
                </option>
              ))}
            </select>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
          {[firstCandidate, secondCandidate].filter(Boolean).map((candidate, index) => (
            <article className="panel p-5" key={getCandidateId(candidate)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Candidate {index === 0 ? "A" : "B"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{candidate.name}</h2>
                  <p className="text-sm font-semibold text-slate-500">{candidate.role}</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                  {getScore(candidate, "overall")}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Code", "coding"],
                  ["Comm.", "communication"],
                  ["Tech", "techKnowledge"],
                  ["Confidence", "confidence"]
                ].map(([label, key]) => (
                  <div className="rounded-lg border border-slate-200 p-3" key={key}>
                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-1 text-xl font-bold">{getScore(candidate, key)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <section className="panel p-5">
          <h2 className="text-xl font-bold">Metric radar</h2>
          <div className="mt-4 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarRows}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  dataKey="first"
                  fill="#0f766e"
                  fillOpacity={0.25}
                  name={firstCandidate?.name || "Candidate A"}
                  stroke="#0f766e"
                />
                <Radar
                  dataKey="second"
                  fill="#d97706"
                  fillOpacity={0.2}
                  name={secondCandidate?.name || "Candidate B"}
                  stroke="#d97706"
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </section>
    </div>
  );
}
