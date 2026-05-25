import { BriefcaseBusiness, GraduationCap, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const [mode, setMode] = useState(location.pathname === "/signup" ? "signup" : "login");
  const [form, setForm] = useState({
    name: "",
    email: "hr@hiresense.ai",
    password: "password123",
    role: "hiring_manager"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user =
        mode === "signup"
          ? await register({
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role
            })
          : await login({
              email: form.email,
              password: form.password
            });
      navigate(getRoleHomePath(user.role));
    } catch {
      setError(
        mode === "signup"
          ? "Signup failed. Check the fields and try again."
          : "Login failed. Start the API or use seeded credentials after setup."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <form className="panel p-6" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-tealcore">
            {mode === "login" ? <LogIn size={22} /> : <UserPlus size={22} />}
          </span>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Candidate and hiring manager platforms
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          {[
            ["login", "Sign in"],
            ["signup", "Sign up"]
          ].map(([value, label]) => (
            <button
              className={[
                "rounded-md px-3 py-2 text-sm font-bold transition",
                mode === value ? "bg-white text-ink shadow-sm" : "text-slate-600"
              ].join(" ")}
              key={value}
              type="button"
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              role: "candidate",
              label: "Candidate",
              icon: GraduationCap
            },
            {
              role: "hiring_manager",
              label: "Hiring manager",
              icon: BriefcaseBusiness
            }
          ].map((item) => {
            const Icon = item.icon;
            const selected = form.role === item.role;
            return (
              <button
                className={[
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition",
                  selected
                    ? "border-tealcore bg-teal-50 text-teal-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                ].join(" ")}
                key={item.role}
                type="button"
                onClick={() => setForm({ ...form, role: item.role })}
              >
                <Icon size={20} />
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>

        {mode === "signup" && (
          <label className="mt-5 block text-sm font-bold text-slate-700">
            Name
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Your name"
              required={mode === "signup"}
            />
          </label>
        )}

        <label className="mt-6 block text-sm font-bold text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        <button type="submit" className="command-button mt-6 w-full" disabled={loading}>
          {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
          {loading
            ? mode === "login"
              ? "Signing in"
              : "Creating account"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>

        {mode === "login" && <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {demoAccounts.map((account) => (
            <button
              className="secondary-button w-full"
              key={account.email}
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  email: account.email,
                  password: account.password,
                  role: account.label === "Candidate" ? "candidate" : "hiring_manager"
                })
              }
            >
              {account.label}
            </button>
          ))}
        </div>}
      </form>

      <aside className="panel p-6">
        <h2 className="text-xl font-bold">Choose your workspace</h2>
        <div className="mt-5 grid gap-4">
          <div className="rounded-lg border border-teal-100 bg-teal-50 p-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-tealcore" size={22} />
              <h3 className="font-bold">Candidate platform</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Practice interviews", "Resume ATS score", "Code practice", "Premium upgrade"].map(
                (item) => (
                  <div className="rounded-lg bg-white px-3 py-2 text-sm font-bold" key={item}>
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="text-ink" size={22} />
              <h3 className="font-bold">Hiring manager platform</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Interview links", "Candidate table", "AI reports", "Compare candidates"].map(
                (item) => (
                  <div className="rounded-lg bg-white px-3 py-2 text-sm font-bold" key={item}>
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
