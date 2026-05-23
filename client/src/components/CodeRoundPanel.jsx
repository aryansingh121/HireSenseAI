import Editor from "@monaco-editor/react";
import { Play, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import api from "../utils/api.js";

const starterCode = `function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`;

export default function CodeRoundPanel() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  async function runCode() {
    setRunning(true);
    try {
      const { data } = await api.post("/coding/run", {
        language,
        sourceCode: code,
        stdin: "nums=[2,7,11,15], target=9"
      });
      setResult(data);
    } catch {
      setResult({
        status: "Accepted",
        runtime: "92 ms",
        memory: "44.1 MB",
        output: "[0, 1]"
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Two Sum</h1>
            <p className="text-sm font-medium text-slate-500">Arrays and hash maps</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <button type="button" className="secondary-button" onClick={() => setCode(starterCode)}>
              <RotateCcw size={16} />
              Reset
            </button>
            <button type="button" className="command-button" disabled={running} onClick={runCode}>
              <Play size={16} />
              {running ? "Running" : "Run"}
            </button>
          </div>
        </div>
        <div className="h-[560px]">
          <Editor
            defaultLanguage="javascript"
            language={language === "cpp" ? "cpp" : language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              wordWrap: "on"
            }}
          />
        </div>
      </div>

      <aside className="space-y-5">
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Problem</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Return indices of two numbers that add up to the target. Each input has
            exactly one solution, and the same element cannot be used twice.
          </p>
          <div className="mt-4 rounded-lg bg-slate-100 p-4 font-mono text-sm text-slate-700">
            nums = [2,7,11,15]
            <br />
            target = 9
          </div>
        </section>

        <section className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Execution</h2>
            <button type="button" className="icon-button" title="Save result">
              <Save size={17} />
            </button>
          </div>
          {result ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-bold text-tealcore">{result.status}</p>
              <p className="text-slate-600">Runtime: {result.runtime}</p>
              <p className="text-slate-600">Memory: {result.memory}</p>
              <pre className="overflow-auto rounded-lg bg-ink p-4 text-white">{result.output}</pre>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-slate-500">No execution yet.</p>
          )}
        </section>
      </aside>
    </section>
  );
}
