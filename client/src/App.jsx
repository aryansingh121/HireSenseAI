import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import CodingRound from "./pages/CodingRound.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Interview from "./pages/Interview.jsx";
import Login from "./pages/Login.jsx";
import Reports from "./pages/Reports.jsx";
import ResumeAnalyzer from "./pages/ResumeAnalyzer.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slatewash text-ink">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/coding" element={<CodingRound />} />
          <Route path="/resume" element={<ResumeAnalyzer />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
