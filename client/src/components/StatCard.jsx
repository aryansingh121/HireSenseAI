import { ArrowUpRight } from "lucide-react";

const toneMap = {
  amber: "bg-amber-50 text-amber-700",
  plum: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-700",
  teal: "bg-teal-50 text-teal-700"
};

export default function StatCard({ label, value, tone = "teal", trend }) {
  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-normal text-ink">{value}</p>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${toneMap[tone]}`}>
          {trend}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-500">
        <ArrowUpRight size={16} className="text-tealcore" />
        Updated from latest assessment activity
      </div>
    </section>
  );
}
