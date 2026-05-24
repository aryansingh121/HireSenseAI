import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate"
    },
    candidateName: String,
    role: String,
    recommendation: String,
    summary: String,
    scores: {
      communication: Number,
      coding: Number,
      confidence: Number,
      overall: Number
    },
    strengths: [String],
    risks: [String]
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
