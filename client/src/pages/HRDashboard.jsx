import { ArrowDownUp, ExternalLink, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { hrDemoCandidates } from "../data/hrDemoCandidates.js";
import {
  getCandidateId,
  getPrimaryStrength,
  getPrimaryWeakness,
  getScore
} from "../utils/candidateMetrics.js";
import api from "../utils/api.js";

const columns = [
  { key: "name", label: "Candidate" },
  { key: "overall", label: "Overall" },
  { key: "coding", label: "Code" },
  { key: "communication", label: "Comm." },
  { key: "techKnowledge", label: "Tech" },
  { key: "confidence", label: "Confidence" },
  { key: "strength", label: "Strength" },
  { key: "weakness", label: "Weakness" }
];

function sortValue(candidate, key) {
  if (["overall", "coding", "communication", "techKnowledge", "confidence"].includes(key)) {
    return getScore(candidate, key);
  }
  if (key === "strength") return getPrimaryStrength(candidate).toLowerCase();
  if (key === "weakness") return getPrimaryWeakness(candidate).toLowerCase();
  return String(candidate[key] || "").toLowerCase();
}

export default function HRDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "overall", direction: "desc" });

  useEffect(() => {
    async function loadCandidates() {
      try {
        const { data } = await api.get("/candidates");
        setCandidates(data);
      } catch {
        setCandidates(hrDemoCandidates);
      }
    }

    loadCandidates();
  }, []);

  const visibleCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      const haystack = [
        candidate.name,
        candidate.email,
        candidate.role,
        candidate.status,
        ...(candidate.strengths || []),
        ...(candidate.weaknesses || [])
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    return filtered.sort((first, second) => {
      const firstValue = sortValue(first, sort.key);
      const secondValue = sortValue(second, sort.key);
      if (firstValue < secondValue) return sort.direction === "asc" ? -1 : 1;
      if (firstValue > secondValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [candidates, query, sort]);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc"
    }));
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-tealcore">Hiring dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">Candidate performance table</h1>
        </div>
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm font-medium outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search candidates"
          />
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 text-left font-bold text-slate-600">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      <ArrowDownUp size={14} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-bold text-slate-600">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleCandidates.map((candidate) => (
                <tr key={getCandidateId(candidate)} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-bold text-ink">{candidate.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{candidate.role}</p>
                  </td>
                  <td className="px-4 py-4 font-bold">{getScore(candidate, "overall")}</td>
                  <td className="px-4 py-4">{getScore(candidate, "coding")}</td>
                  <td className="px-4 py-4">{getScore(candidate, "communication")}</td>
                  <td className="px-4 py-4">{getScore(candidate, "techKnowledge")}</td>
                  <td className="px-4 py-4">{getScore(candidate, "confidence")}</td>
                  <td className="px-4 py-4 text-teal-700">{getPrimaryStrength(candidate)}</td>
                  <td className="px-4 py-4 text-red-700">{getPrimaryWeakness(candidate)}</td>
                  <td className="px-4 py-4">
                    <Link
                      className="inline-flex items-center gap-1.5 font-bold text-tealcore"
                      to={`/hr/candidates/${getCandidateId(candidate)}`}
                    >
                      Open
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
