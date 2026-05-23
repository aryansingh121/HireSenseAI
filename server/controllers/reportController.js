import { isDbReady } from "../config/db.js";
import Report from "../models/Report.js";
import { generateInterviewReport } from "../services/aiService.js";
import { demoReports } from "../services/demoData.js";

export async function listReports(req, res, next) {
  try {
    if (!isDbReady()) return res.json(demoReports);

    const reports = await Report.find().sort({ createdAt: -1 }).populate("candidate");
    return res.json(reports);
  } catch (error) {
    return next(error);
  }
}

export async function createReport(req, res, next) {
  try {
    const generated = await generateInterviewReport(req.body);

    if (!isDbReady()) {
      return res.status(201).json({ id: "mock-report", ...generated });
    }

    const report = await Report.create({
      candidate: req.body.candidate,
      ...generated
    });

    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
}
