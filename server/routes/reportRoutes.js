import express from "express";
import { createReport, listReports } from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listReports);
router.post("/", protect, createReport);

export default router;
