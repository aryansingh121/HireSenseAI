import { Activity, Eye, Mic2, Smile } from "lucide-react";

const signals = [
  { label: "Eye contact", value: 84, icon: Eye, color: "bg-teal-600" },
  { label: "Speech flow", value: 76, icon: Mic2, color: "bg-amber-600" },
  { label: "Attention", value: 88, icon: Activity, color: "bg-violet-600" },
  { label: "Expression", value: 81, icon: Smile, color: "bg-slate-700" }
];

export default function ConfidencePanel() {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Confidence Detection</h2>
          <p className="text-sm font-medium text-slate-500">Vision and speech signals</p>
        </div>
        <span className="rounded-lg bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">
          Live-ready
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {signals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.label} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon size={18} />
                  </span>
                  <p className="text-sm font-bold">{signal.label}</p>
                </div>
                <span className="text-sm font-bold">{signal.value}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${signal.color}`}
                  style={{ width: `${signal.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
