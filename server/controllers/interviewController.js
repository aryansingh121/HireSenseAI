import { isDbReady } from "../config/db.js";
import InterviewSession from "../models/InterviewSession.js";
import { analyzeInterviewAnswer } from "../services/aiService.js";

const roleQuestions = {
  backend: [
    "How would you design a scalable authentication service?",
    "Explain how indexes affect MongoDB query performance.",
    "What is your approach to API error handling?"
  ],
  frontend: [
    "Explain how React state updates are batched.",
    "How do you reduce unnecessary re-renders?",
    "How would you test a complex form?"
  ],
  default: [
    "Walk through a technical problem you solved recently.",
    "How do you debug production issues?",
    "Explain a trade-off you made in a project."
  ]
};

export async function createInterviewSession(req, res, next) {
  try {
    const role = req.body.role || "default";
    const key = role.toLowerCase().includes("front")
      ? "frontend"
      : role.toLowerCase().includes("back")
        ? "backend"
        : "default";
    const questions = roleQuestions[key];

    if (!isDbReady()) {
      return res.status(201).json({
        id: "mock-session",
        role,
        status: "active",
        questions
      });
    }

    const session = await InterviewSession.create({
      candidate: req.body.candidate,
      role,
      questions
    });

    return res.status(201).json(session);
  } catch (error) {
    return next(error);
  }
}

export async function analyzeAnswer(req, res, next) {
  try {
    const feedback = await analyzeInterviewAnswer(req.body);

    if (isDbReady() && req.body.sessionId) {
      await InterviewSession.findByIdAndUpdate(req.body.sessionId, {
        $push: {
          turns: {
            question: req.body.question,
            answer: req.body.answer,
            score: feedback.score,
            feedback
          }
        }
      });
    }

    return res.json(feedback);
  } catch (error) {
    return next(error);
  }
}
