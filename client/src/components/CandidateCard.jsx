import { CheckCircle2, Clock3, PauseCircle } from "lucide-react";
import ScoreRing from "./ScoreRing.jsx";

const statusIcon = {
  Hold: PauseCircle,
  Review: Clock3,
  Shortlist: CheckCircle2
};

export default function CandidateCard({ candidate }) {
  const StatusIcon = statusIcon[candidate.status] || Clock3;
  const overall = Math.round(
    (candidate.communication + candidate.coding + candidate.confidence) / 3
  );

  return (
    <article className="panel p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold">{candidate.name}</h3>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              <StatusIcon size={14} />
              {candidate.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">{candidate.role}</p>
          <p className="mt-4 text-3xl font-bold">{overall}</p>
          <p className="text-sm font-semibold text-slate-500">Overall hiring score</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ScoreRing label="Comm." value={candidate.communication} color="#0f766e" size={78} />
          <ScoreRing label="Code" value={candidate.coding} color="#d97706" size={78} />
          <ScoreRing label="Confidence" value={candidate.confidence} color="#7c3aed" size={78} />
        </div>
      </div>
    </article>
  );
}
