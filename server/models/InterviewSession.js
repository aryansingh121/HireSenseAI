import mongoose from "mongoose";

const interviewTurnSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    score: Number,
    feedback: mongoose.Schema.Types.Mixed
  },
  { _id: false, timestamps: true }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate"
    },
    role: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed"],
      default: "active"
    },
    questions: [String],
    turns: [interviewTurnSchema],
    finalScore: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

export default InterviewSession;
