import { analyzeResumeBuffer } from "../services/resumeService.js";

export async function analyzeResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF is required" });
    }

    const analysis = await analyzeResumeBuffer(req.file.buffer);
    return res.json(analysis);
  } catch (error) {
    return next(error);
  }
}
