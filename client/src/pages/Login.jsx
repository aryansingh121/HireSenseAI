import { LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleHomePath } from "../utils/roleRoutes.js";

const demoAccounts = [
  {
    label: "Hiring manager",
    email: "hr@hiresense.ai",
    password: "password123"
  },
  {
    label: "Candidate",
    email: "candidate@hiresense.ai",
    password: "password123"
  }
];

export default function Login() {
  const [form, setForm] = useState({ email: "hr@hiresense.ai", password: "password123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form);
      navigate(getRoleHomePath(user.role));
    } catch {
      setError("Login failed. Start the API or use seeded credentials after setup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <form className="panel p-6" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-tealcore">
            <LogIn size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-sm font-medium text-slate-500">Candidate or hiring manager</p>
          </div>
        </div>

        <label className="mt-6 block text-sm font-bold text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        <button type="submit" className="command-button mt-6 w-full" disabled={loading}>
          <LogIn size={16} />
          {loading ? "Signing in" : "Sign in"}
        </button>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {demoAccounts.map((account) => (
            <button
              className="secondary-button w-full"
              key={account.email}
              type="button"
              onClick={() =>
                setForm({
                  email: account.email,
                  password: account.password
                })
              }
            >
              {account.label}
            </button>
          ))}
        </div>
      </form>

      <aside className="panel p-6">
        <h2 className="text-xl font-bold">Access scope</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Candidate practice",
            "Resume analytics",
            "Hiring reports",
            "Interview sessions"
          ].map((item) => (
            <div className="rounded-lg border border-slate-200 p-4 text-sm font-bold" key={item}>
              {item}
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
