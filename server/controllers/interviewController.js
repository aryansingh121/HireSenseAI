import { isDbReady } from "../config/db.js";
import InterviewSession from "../models/InterviewSession.js";
import User from "../models/User.js";
import { analyzeInterviewAnswer } from "../services/aiService.js";
import { GoogleGenAI } from "@google/genai";

const demoInterviewUsage = new Map();

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

export async function createInterviewLink(req, res, next) {
  try {
    const role = req.body.role || "Technical Interview";
    const candidateName = req.body.candidateName || "Candidate";
    const sessionId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const interviewLink = `${baseUrl}/candidate/interview?session=${sessionId}`;

    if (!isDbReady()) {
      return res.status(201).json({
        id: sessionId,
        candidateName,
        role,
        interviewLink,
        status: "scheduled"
      });
    }

    const session = await InterviewSession.create({
      role,
      status: "scheduled",
      questions: roleQuestions.default
    });

    return res.status(201).json({
      id: session._id,
      candidateName,
      role,
      interviewLink: `${baseUrl}/candidate/interview?session=${session._id}`,
      status: session.status
    });
  } catch (error) {
    return next(error);
  }
}

function getMockDemoInterviewsLeft(user) {
  const userId = user?.id || "demo-candidate";
  if (!demoInterviewUsage.has(userId)) {
    demoInterviewUsage.set(userId, user?.demoInterviewsLeft ?? 3);
  }
  return demoInterviewUsage.get(userId);
}

async function getCandidateDemoInterviewsLeft(userId) {
  if (!isDbReady()) return null;

  const user = await User.findById(userId).select("demoInterviewsLeft role");
  if (!user || user.role !== "candidate") return null;
  return user.demoInterviewsLeft;
}

export async function getDemoInterviewStatus(req, res, next) {
  try {
    if (!isDbReady()) {
      const demoInterviewsLeft = getMockDemoInterviewsLeft(req.user);
      return res.json({
        demoInterviewsLeft,
        canStartDemoInterview: demoInterviewsLeft > 0,
        upgradeRequired: demoInterviewsLeft <= 0
      });
    }

    const demoInterviewsLeft = await getCandidateDemoInterviewsLeft(req.user.id);
    if (demoInterviewsLeft === null) {
      return res.status(404).json({ message: "Candidate user not found" });
    }

    return res.json({
      demoInterviewsLeft,
      canStartDemoInterview: demoInterviewsLeft > 0,
      upgradeRequired: demoInterviewsLeft <= 0
    });
  } catch (error) {
    return next(error);
  }
}

export async function startDemoInterview(req, res, next) {
  try {
    const role = req.body.role || "frontend";
    const key = role.toLowerCase().includes("back") ? "backend" : "frontend";
    const questions = roleQuestions[key];

    if (!isDbReady()) {
      const demoInterviewsLeft = getMockDemoInterviewsLeft(req.user);
      if (demoInterviewsLeft <= 0) {
        return res.status(403).json({
          message: "Upgrade to Premium to start more AI interviews",
          demoInterviewsLeft,
          upgradeRequired: true
        });
      }

      return res.status(201).json({
        id: `demo-session-${Date.now()}`,
        role,
        status: "active",
        questions,
        demoInterviewsLeft
      });
    }

    const demoInterviewsLeft = await getCandidateDemoInterviewsLeft(req.user.id);
    if (demoInterviewsLeft === null) {
      return res.status(404).json({ message: "Candidate user not found" });
    }

    if (demoInterviewsLeft <= 0) {
      return res.status(403).json({
        message: "Upgrade to Premium to start more AI interviews",
        demoInterviewsLeft,
        upgradeRequired: true
      });
    }

    const session = await InterviewSession.create({
      role,
      questions,
      status: "active"
    });

    return res.status(201).json({
      id: session._id,
      role,
      status: session.status,
      questions,
      demoInterviewsLeft
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeDemoInterview(req, res, next) {
  try {
    if (!isDbReady()) {
      const userId = req.user?.id || "demo-candidate";
      const current = getMockDemoInterviewsLeft(req.user);
      const demoInterviewsLeft = Math.max(current - 1, 0);
      demoInterviewUsage.set(userId, demoInterviewsLeft);

      return res.json({
        demoInterviewsLeft,
        upgradeRequired: demoInterviewsLeft <= 0,
        user: {
          ...req.user,
          demoInterviewsLeft
        }
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        role: "candidate",
        demoInterviewsLeft: { $gt: 0 }
      },
      { $inc: { demoInterviewsLeft: -1 } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      const demoInterviewsLeft = await getCandidateDemoInterviewsLeft(req.user.id);
      return res.status(403).json({
        message: "Upgrade to Premium to start more AI interviews",
        demoInterviewsLeft: demoInterviewsLeft ?? 0,
        upgradeRequired: true
      });
    }

    return res.json({
      demoInterviewsLeft: user.demoInterviewsLeft,
      upgradeRequired: user.demoInterviewsLeft <= 0,
      user
    });
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

export async function askNextQuestion(req, res, next) {
  try {
    const { sessionId, currentQuestionIndex, role } = req.body;
    
    const key = role?.toLowerCase().includes("back") ? "backend" : 
                role?.toLowerCase().includes("front") ? "frontend" : "default";
    
    const questions = roleQuestions[key];
    const index = currentQuestionIndex || 0;
    
    if (index >= questions.length) {
      return res.json({
        question: "Thank you for your time. That concludes our technical interview.",
        isFinished: true
      });
    }

    const nextQuestion = questions[index];
    
    return res.json({
      question: nextQuestion,
      isFinished: false
    });
  } catch (error) {
    return next(error);
  }
}

export async function chatWithLLM(req, res, next) {
  try {
    const { sessionId, role, transcript, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured.",
        question: "I'm sorry, my AI brain is disconnected because the API key is missing. Please check your backend .env file.",
        isFinished: false 
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let systemPrompt = `You are an expert Technical Hiring Manager interviewing a candidate for a ${role} position. 
Keep your responses short, conversational, and strictly related to technical interviewing. 
Do not output markdown, formatting, or special characters because your response will be read aloud by a Text-to-Speech engine.
If the candidate says they are done or want to finish, conclude the interview.
Here is the conversation history:
${history || 'No previous history.'}

Candidate just said: "${transcript}"

Generate your next short conversational response.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
    });
    
    const text = response.text || "I'm sorry, I couldn't process that.";
    const isFinished = text.toLowerCase().includes("conclude") || text.toLowerCase().includes("thank you for your time");

    return res.json({
      question: text,
      isFinished
    });
  } catch (error) {
    console.error("LLM Error:", error);
    return res.json({
      question: "I had a connection error with my brain. Could you repeat that?",
      isFinished: false
    });
  }
}
