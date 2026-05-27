import { Crown, Mic, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import InterviewConsole from "../components/interview/InterviewConsole.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

function UpgradeState() {
  return (
    <section className="panel p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-saffron">
              <Crown size={22} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase text-saffron">Upgrade required</p>
              <h1 className="text-2xl font-bold">Upgrade to Premium</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            You have used all free demo interviews. Premium unlocks unlimited AI
            interviews, deeper reports, and role-specific question sets.
          </p>
        </div>
        <button type="button" className="command-button bg-saffron hover:bg-amber-700">
          <Crown size={16} />
          Upgrade to Premium
        </button>
      </div>
    </section>
  );
}

export default function CandidateInterview() {
  const { updateUser, user } = useAuth();
  const [status, setStatus] = useState(null);
  const [session, setSession] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadStatus() {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.get("/interviews/demo/status");
      setStatus(data);
      if (user) {
        updateUser({
          ...user,
          demoInterviewsLeft: data.demoInterviewsLeft
        });
      }
    } catch {
      setStatus({
        demoInterviewsLeft: user?.demoInterviewsLeft ?? 0,
        canStartDemoInterview: (user?.demoInterviewsLeft ?? 0) > 0,
        upgradeRequired: (user?.demoInterviewsLeft ?? 0) <= 0
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function startDemoInterview() {
    setStarting(true);
    setMessage("");
    try {
      const { data } = await api.post("/interviews/demo/start", {
        role: "frontend"
      });
      setSession(data);
      setHasAnswered(false);
    } catch (error) {
      const data = error.response?.data;
      setStatus({
        demoInterviewsLeft: data?.demoInterviewsLeft ?? 0,
        canStartDemoInterview: false,
        upgradeRequired: true
      });
      if (user) {
        updateUser({
          ...user,
          demoInterviewsLeft: data?.demoInterviewsLeft ?? 0
        });
      }
      setMessage(data?.message || "Upgrade to Premium to start more AI interviews");
    } finally {
      setStarting(false);
    }
  }

  async function completeDemoInterview() {
    setCompleting(true);
    setMessage("");
    try {
      const { data } = await api.post("/interviews/demo/complete", {
        sessionId: session?.id
      });
      setStatus({
        demoInterviewsLeft: data.demoInterviewsLeft,
        canStartDemoInterview: data.demoInterviewsLeft > 0,
        upgradeRequired: data.upgradeRequired
      });
      if (data.user) updateUser(data.user);
      setSession(null);
      setHasAnswered(false);
      setMessage("Demo interview completed and your remaining count was updated.");
    } catch (error) {
      const data = error.response?.data;
      setStatus({
        demoInterviewsLeft: data?.demoInterviewsLeft ?? 0,
        canStartDemoInterview: false,
        upgradeRequired: true
      });
      if (user) {
        updateUser({
          ...user,
          demoInterviewsLeft: data?.demoInterviewsLeft ?? 0
        });
      }
      setMessage(data?.message || "Unable to complete this demo interview");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <section className="panel p-6">
        <p className="text-sm font-semibold text-slate-500">Loading interview access...</p>
      </section>
    );
  }

  if (status?.upgradeRequired && !session) {
    return <UpgradeState />;
  }

  if (session) {
    return (
      <div className="fixed inset-0 z-50">
        <InterviewConsole session={session} onEnd={completeDemoInterview} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-tealcore">AI demo interview</p>
            <h1 className="mt-1 text-2xl font-bold">Practice with live AI feedback</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {status?.demoInterviewsLeft ?? 0} demo interviews left
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="secondary-button" onClick={loadStatus}>
              <RotateCcw size={16} />
              Refresh
            </button>
            {!session && (
              <button
                type="button"
                className="command-button"
                disabled={starting || !status?.canStartDemoInterview}
                onClick={startDemoInterview}
              >
                <Mic size={16} />
                {starting ? "Starting" : "Start demo"}
              </button>
            )}
            {session && (
              <button
                type="button"
                className="command-button"
                disabled={completing || !hasAnswered}
                onClick={completeDemoInterview}
              >
                <Sparkles size={16} />
                {completing ? "Completing" : "Complete demo"}
              </button>
            )}
          </div>
        </div>
        {message && <p className="mt-4 text-sm font-semibold text-slate-600">{message}</p>}
      </section>

      <section className="panel p-6">
        <p className="text-sm font-semibold text-slate-600">
          Start a demo interview to unlock the AI question console.
        </p>
      </section>
    </div>
  );
}
