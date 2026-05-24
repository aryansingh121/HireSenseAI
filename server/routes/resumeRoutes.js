import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/resumeController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF resumes are supported"));
    }
    return callback(null, true);
  }
});

router.post("/analyze", upload.single("resume"), analyzeResume);

export default router;
