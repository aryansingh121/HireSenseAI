import { motion } from "framer-motion";
import { MessageSquareText, Mic, RotateCcw, Send, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { interviewQuestions } from "../data/mockData.js";
import useSpeechRecognition from "../hooks/useSpeechRecognition.js";
import api from "../utils/api.js";

export default function InterviewConsole({ onAnswerAnalyzed }) {
  const [answer, setAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const speech = useSpeechRecognition();

  const question = interviewQuestions[currentQuestion];
  const combinedAnswer = useMemo(
    () => [answer, speech.transcript].filter(Boolean).join(" ").trim(),
    [answer, speech.transcript]
  );

  async function submitAnswer() {
    if (!combinedAnswer) return;
    setLoading(true);
    try {
      const { data } = await api.post("/interviews/analyze-answer", {
        question,
        answer: combinedAnswer
      });
      setFeedback(data);
      onAnswerAnalyzed?.(data);
    } catch {
      const fallbackFeedback = {
        score: 78,
        strengths: ["Structured answer", "Relevant examples"],
        improvements: ["Add measurable impact", "Close with a clearer trade-off"],
        sentiment: "confident"
      };
      setFeedback(fallbackFeedback);
      onAnswerAnalyzed?.(fallbackFeedback);
    } finally {
      setLoading(false);
    }
  }

  function nextQuestion() {
    setCurrentQuestion((index) => (index + 1) % interviewQuestions.length);
    setAnswer("");
    setFeedback(null);
    speech.reset();
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="panel p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-tealcore">
            <MessageSquareText size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-500">Question {currentQuestion + 1}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal">{question}</h1>
          </div>
        </div>

        <textarea
          className="mt-6 min-h-52 w-full resize-y rounded-lg border border-slate-300 bg-white p-4 text-sm leading-6 outline-none transition focus:border-tealcore focus:ring-2 focus:ring-tealcore/20"
          placeholder="Candidate answer..."
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />

        {speech.transcript && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {speech.transcript}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="secondary-button"
            onClick={speech.isListening ? speech.stop : speech.start}
          >
            {speech.isListening ? <Square size={16} /> : <Mic size={16} />}
            {speech.isListening ? "Stop" : "Voice"}
          </button>
          <button type="button" className="secondary-button" onClick={nextQuestion}>
            <RotateCcw size={16} />
            Next
          </button>
          <button
            type="button"
            className="command-button"
            disabled={loading || !combinedAnswer}
            onClick={submitAnswer}
          >
            <Send size={16} />
            {loading ? "Analyzing" : "Analyze"}
          </button>
        </div>

        {speech.error && <p className="mt-3 text-sm font-semibold text-red-600">{speech.error}</p>}
      </div>

      <motion.aside
        className="panel p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <p className="text-sm font-bold uppercase text-slate-500">AI feedback</p>
        {feedback ? (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-5xl font-bold">{feedback.score}</p>
              <p className="text-sm font-semibold text-slate-500">Answer score</p>
            </div>
            <div>
              <h2 className="text-sm font-bold">Strengths</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {feedback.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-bold">Improvements</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {feedback.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-dashed border-slate-300 p-6 text-sm font-medium text-slate-500">
            Submit an answer to generate score, strengths, and improvements.
          </div>
        )}
      </motion.aside>
    </section>
  );
}
