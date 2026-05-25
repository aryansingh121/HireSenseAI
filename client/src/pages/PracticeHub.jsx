import { Code2, FileSearch, Mic, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CodeRoundPanel from "../components/CodeRoundPanel.jsx";
import ResumeAnalyzerPanel from "../components/ResumeAnalyzerPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

export default function PracticeHub() {
  const { updateUser, user } = useAuth();
  const [demoInterviewsLeft, setDemoInterviewsLeft] = useState(user?.demoInterviewsLeft ?? 0);

  useEffect(() => {
    async function loadDemoStatus() {
      try {
        const { data } = await api.get("/interviews/demo/status");
        setDemoInterviewsLeft(data.demoInterviewsLeft);
        if (user) {
          updateUser({
            ...user,
            demoInterviewsLeft: data.demoInterviewsLeft
          });
        }
      } catch {
        setDemoInterviewsLeft(user?.demoInterviewsLeft ?? 0);
      }
    }

    loadDemoStatus();
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-tealcore">Practice hub</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
            Prepare for technical interviews
          </h1>
        </div>
        <Link
          to="/candidate/interview"
          className={demoInterviewsLeft > 0 ? "command-button" : "secondary-button"}
        >
          <Mic size={16} />
          {demoInterviewsLeft > 0 ? "Start demo interview" : "Upgrade to Premium"}
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-tealcore">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Demo interviews</p>
              <p className="text-2xl font-bold">{demoInterviewsLeft}</p>
            </div>
          </div>
        </article>
        <article className="panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-saffron">
              <FileSearch size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Resume analyzer</p>
              <p className="text-2xl font-bold">ATS</p>
            </div>
          </div>
        </article>
        <article className="panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <Code2 size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Code practice</p>
              <p className="text-2xl font-bold">Judge0</p>
            </div>
          </div>
        </article>
      </section>

      <ResumeAnalyzerPanel />
      <CodeRoundPanel />
    </div>
  );
}
