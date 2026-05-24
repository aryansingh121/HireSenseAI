import ReportCard from "../components/ReportCard.jsx";
import { reports } from "../data/mockData.js";

export default function Reports() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-tealcore">Decision support</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">Interview reports</h1>
        </div>
        <button type="button" className="command-button">Compare candidates</button>
      </div>
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
