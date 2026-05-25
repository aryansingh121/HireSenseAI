import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Applied", "Interviewing", "Review", "Shortlist", "Hold", "Rejected"],
      default: "Applied"
    },
    skills: [String],
    resumeUrl: String,
    parsedResume: {
      summary: String,
      experience: [String],
      education: [String],
      skills: [String],
      atsScore: Number
    },
    scores: {
      communication: { type: Number, default: 0 },
      coding: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      techKnowledge: { type: Number, default: 0 },
      overall: { type: Number, default: 0 }
    },
    strengths: [String],
    weaknesses: [String],
    interviewResult: {
      summary: String,
      recommendation: String,
      questionsAnswered: Number,
      highlights: [String],
      risks: [String]
    }
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
