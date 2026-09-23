import express from "express";
import protect from "../Middlewares/authMiddleware.js";
import {
    enhanceJobDescription,
    enhanceProfessionalSummary,
    getEntryTips,
    uploadResume,
} from "../Controllers/aiControllers.js";

const aiRouter = express.Router();

aiRouter.post("/enhance-pro-sum", protect, enhanceProfessionalSummary);
aiRouter.post("/enhance-job-desc", protect, enhanceJobDescription);
aiRouter.post("/upload-resume", protect, uploadResume);
aiRouter.post("/entry-tips", protect, getEntryTips);

export default aiRouter;
