import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import CandidateLayout from "./layouts/CandidateLayout.jsx";
import HRLayout from "./layouts/HRLayout.jsx";
import Login from "./pages/Login.jsx";
import { getRoleHomePath } from "./utils/roleRoutes.js";

const CandidateInterview = lazy(() => import("./pages/CandidateInterview.jsx"));
const CandidateReport = lazy(() => import("./pages/CandidateReport.jsx"));
const CompareCandidates = lazy(() => import("./pages/CompareCandidates.jsx"));
const CodingRound = lazy(() => import("./pages/CodingRound.jsx"));
const HRDashboard = lazy(() => import("./pages/HRDashboard.jsx"));
const MeetingCreator = lazy(() => import("./pages/MeetingCreator.jsx"));
const PracticeHub = lazy(() => import("./pages/PracticeHub.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const ResumeAnalyzer = lazy(() => import("./pages/ResumeAnalyzer.jsx"));

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slatewash p-6 text-sm font-semibold text-slate-500">
          Loading...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />

        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRoles="candidate">
              <CandidateLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PracticeHub />} />
          <Route path="interview" element={<CandidateInterview />} />
          <Route path="resume" element={<ResumeAnalyzer />} />
          <Route path="coding" element={<CodingRound />} />
        </Route>

        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles="hiring_manager">
              <HRLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HRDashboard />} />
          <Route path="setup" element={<MeetingCreator />} />
          <Route path="candidates/:id" element={<CandidateReport />} />
          <Route path="reports" element={<Reports />} />
          <Route path="compare" element={<CompareCandidates />} />
        </Route>

        <Route path="/interview" element={<Navigate to="/candidate/interview" replace />} />
        <Route path="/coding" element={<Navigate to="/candidate/coding" replace />} />
        <Route path="/resume" element={<Navigate to="/candidate/resume" replace />} />
        <Route path="/reports" element={<Navigate to="/hr/reports" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
