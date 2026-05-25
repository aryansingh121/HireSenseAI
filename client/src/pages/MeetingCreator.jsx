import { Copy, Link2, Plus, Send } from "lucide-react";
import { useState } from "react";
import api from "../utils/api.js";

export default function MeetingCreator() {
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    role: "Frontend Engineer"
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createMeeting(event) {
    event.preventDefault();
    setLoading(true);
    setCopied(false);

    try {
      const { data } = await api.post("/interviews/links", form);
      setSession(data);
    } catch {
      const id = `ai-${Date.now()}`;
      setSession({
        id,
        candidateName: form.candidateName || "Candidate",
        role: form.role,
        status: "scheduled",
        interviewLink: `${window.location.origin}/candidate/interview?session=${id}`
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!session?.interviewLink) return;
    await navigator.clipboard.writeText(session.interviewLink);
    setCopied(true);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <form className="panel p-5" onSubmit={createMeeting}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-tealcore">
            <Plus size={22} />
          </span>
          <div>
            <p className="text-sm font-bold uppercase text-tealcore">Interview setup</p>
            <h1 className="text-2xl font-bold">Create AI interview link</h1>
          </div>
        </div>

        <label className="mt-6 block text-sm font-bold text-slate-700">
          Candidate name
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            value={form.candidateName}
            onChange={(event) => setForm({ ...form, candidateName: event.target.value })}
            placeholder="Candidate name"
          />
        </label>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Candidate email
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            type="email"
            value={form.candidateEmail}
            onChange={(event) => setForm({ ...form, candidateEmail: event.target.value })}
            placeholder="candidate@example.com"
          />
        </label>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Role
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option>Frontend Engineer</option>
            <option>Backend Engineer</option>
            <option>Full Stack Developer</option>
            <option>Data Engineer</option>
          </select>
        </label>

        <button type="submit" className="command-button mt-6 w-full" disabled={loading}>
          <Send size={16} />
          {loading ? "Generating" : "Generate link"}
        </button>
      </form>

      <aside className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Link2 size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold">Session link</h2>
            <p className="text-sm font-medium text-slate-500">Share this with the candidate</p>
          </div>
        </div>

        {session ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-500">Candidate</p>
              <p className="mt-1 font-bold">{session.candidateName}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-500">Interview URL</p>
              <p className="mt-2 break-all font-mono text-sm text-slate-700">
                {session.interviewLink}
              </p>
            </div>
            <button type="button" className="secondary-button" onClick={copyLink}>
              <Copy size={16} />
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-dashed border-slate-300 p-6 text-sm font-medium text-slate-500">
            Generated links appear here.
          </div>
        )}
      </aside>
    </section>
  );
}
