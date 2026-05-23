import { Download, ThumbsUp } from "lucide-react";
import ScoreRing from "./ScoreRing.jsx";

export default function ReportCard({ report }) {
  return (
    <article className="panel p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold">{report.candidate}</h3>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
              <ThumbsUp size={14} />
              {report.recommendation}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">{report.role}</p>
          <p className="mt-4 text-sm leading-6 text-slate-700">{report.summary}</p>
          <button type="button" className="secondary-button mt-5">
            <Download size={16} />
            Download report
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreRing label="Overall" value={report.scores.overall} color="#172026" size={78} />
          <ScoreRing label="Comm." value={report.scores.communication} color="#0f766e" size={78} />
          <ScoreRing label="Code" value={report.scores.coding} color="#d97706" size={78} />
          <ScoreRing label="Confidence" value={report.scores.confidence} color="#7c3aed" size={78} />
        </div>
      </div>
    </article>
  );
}
