import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Error Caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 font-sans text-slate-200">
          <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
            <AlertCircle className="mb-6 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-white">Something went wrong</h2>
            <p className="mb-8 text-slate-400">
              The AI Interview environment encountered an unexpected error.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700"
            >
              <RefreshCw size={20} />
              Restart Interview
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
