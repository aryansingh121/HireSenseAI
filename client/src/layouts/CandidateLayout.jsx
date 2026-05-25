import {
  Code2,
  FileSearch,
  Home,
  LogOut,
  Mic,
  Sparkles
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const candidateNav = [
  { to: "/candidate", label: "Home", icon: Home, end: true },
  { to: "/candidate/interview", label: "Interview", icon: Mic },
  { to: "/candidate/resume", label: "Resume", icon: FileSearch },
  { to: "/candidate/coding", label: "Coding", icon: Code2 }
];

export default function CandidateLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slatewash text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <NavLink to="/candidate" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tealcore text-white">
              <Sparkles size={22} />
            </span>
            <div>
              <p className="text-base font-bold leading-5">HireSense AI</p>
              <p className="text-xs font-medium text-slate-500">Candidate workspace</p>
            </div>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2">
            {candidateNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-tealcore text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                    ].join(" ")
                  }
                  end={item.end}
                  key={item.to}
                  to={item.to}
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              );
            })}
            <button type="button" className="icon-button" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-slate-700">{user?.name || "Candidate"}</p>
            <p className="text-xs font-semibold text-slate-500">{user?.email}</p>
          </div>
          <span className="rounded-lg bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
            {user?.demoInterviewsLeft ?? 0} demo interviews left
          </span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
