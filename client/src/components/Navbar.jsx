import {
  BarChart3,
  Code2,
  FileSearch,
  Home,
  LogIn,
  Mic,
  ScrollText
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/interview", label: "Interview", icon: Mic },
  { to: "/coding", label: "Coding", icon: Code2 },
  { to: "/resume", label: "Resume", icon: FileSearch },
  { to: "/reports", label: "Reports", icon: ScrollText }
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
            <BarChart3 size={22} />
          </span>
          <div>
            <p className="text-base font-bold leading-5">HireSense AI</p>
            <p className="text-xs font-medium text-slate-500">Smart hiring console</p>
          </div>
        </NavLink>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-tealcore text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                  ].join(" ")
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
          <NavLink to="/login" className="icon-button" title="Login">
            <LogIn size={18} />
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
