import { motion } from "framer-motion";
import CandidateCard from "../components/CandidateCard.jsx";
import ConfidencePanel from "../components/ConfidencePanel.jsx";
import StatCard from "../components/StatCard.jsx";
import { candidates, dashboardStats } from "../data/mockData.js";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-tealcore">Hiring workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
            Technical screening pipeline
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="secondary-button">Export CSV</button>
          <button type="button" className="command-button">New interview</button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Candidate reports</h2>
            <span className="text-sm font-semibold text-slate-500">Latest</span>
          </div>
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </section>
        <ConfidencePanel />
      </div>
    </div>
  );
}
